import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto, LoginDto } from './dto';
import { ConfigService } from '@nestjs/config';
import { MailHelper } from './mail';
import { FaceRecognitionService } from '../face-recognition/face-recognition.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private faceRecognitionService: FaceRecognitionService,
  ) {}

  /**
   * Register a new user with email and password
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      name,
      email,
      passwordHash,
    });

    await user.save();

    try {
      const mailHelper = new MailHelper(this.configService);
      await mailHelper.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email after registration:', error);
    }

    // Generate JWT
    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async adminRegister(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new this.userModel({
      name,
      email,
      passwordHash,
    });

    await user.save();

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async sendPasswordEmail(email: string, password: string) {
    const mailHelper = new MailHelper(this.configService);
    await mailHelper.sendPasswordEmail(email, password);
    return { success: true };
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is rusticated. Please contact admin.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Login user with face recognition
   */
  async faceLogin(selfieBuffer: Buffer) {
    // 1. Generate descriptor for the selfie
    const faceDescriptor = await this.faceRecognitionService.generateFaceDescriptor(selfieBuffer);
    if (!faceDescriptor) {
      throw new BadRequestException('No face detected in photo');
    }

    // 2. Find all active users with enrolled faces
    const users = await this.userModel.find({ 
      isActive: true, 
      faceEmbedding: { $exists: true, $not: { $size: 0 } } 
    }).exec();

    if (users.length === 0) {
      throw new UnauthorizedException('No users found with face recognition enabled');
    }

    // 3. Find matching user
    let bestMatch: UserDocument | null = null;
    let minDistance = 0.5; // Consistent threshold with event matching (was 0.6)

    for (const user of users) {
      if (!user.faceEmbedding) continue;
      
      const distance = this.calculateDistance(faceDescriptor, user.faceEmbedding);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = user;
      }
    }

    if (!bestMatch) {
      throw new UnauthorizedException('Face not recognized');
    }

    // 4. Generate JWT
    const token = this.generateToken(bestMatch._id.toString(), bestMatch.email);

    return {
      user: {
        id: bestMatch._id.toString(),
        name: bestMatch.name,
        email: bestMatch.email,
        createdAt: bestMatch.createdAt,
      },
      token,
    };
  }

  /**
   * Enroll user's face for recognition
   */
  async enrollFace(userId: string, selfieBuffer: Buffer) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const faceDescriptor = await this.faceRecognitionService.generateFaceDescriptor(selfieBuffer);
    if (!faceDescriptor) {
      throw new BadRequestException('No face detected in photo');
    }

    user.faceEmbedding = Array.from(faceDescriptor);
    await user.save();

    return { success: true, message: 'Face enrolled successfully' };
  }

  /**
   * Remove user's face enrollment
   */
  async removeFaceEnrollment(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.faceEmbedding = [];
    await user.save();

    return { success: true, message: 'Face enrollment removed successfully' };
  }

  /**
   * Calculate Euclidean distance between two embeddings
   */
  private calculateDistance(descriptor1: Float32Array, descriptor2: number[]): number {
    let distance = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      distance += diff * diff;
    }
    return Math.sqrt(distance);
  }

  async forgotPassword(email: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();

    if (!user) {
      return { success: true };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await user.save();

    try {
      const mailHelper = new MailHelper(this.configService);
      await mailHelper.sendPasswordEmail(user.email, newPassword);
    } catch (error) {
      console.error('Failed to send password email after reset:', error);
    }

    return { success: true };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is rusticated');
    }

    return user;
  }

  /**
   * Generate JWT access token
   */
  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
