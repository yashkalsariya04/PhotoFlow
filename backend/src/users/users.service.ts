import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private uploadDir: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatarFilename ? true : false,
      avatarFilename: user.avatarFilename,
      designation: user.designation,
      location: user.location,
      faceEmbedding: user.faceEmbedding ? user.faceEmbedding.length > 0 : false,
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; designation?: string; location?: string }, file?: Express.Multer.File) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.userModel.findOne({ email: data.email }).exec();
      if (existing) throw new ConflictException('Email already in use');
      user.email = data.email.toLowerCase();
    }

    if (data.name) user.name = data.name;
    if (data.designation) user.designation = data.designation;
    if (data.location) user.location = data.location;

    if (file) {
      // Save avatar to uploads/avatars/<userId>/
      const userDir = path.join(this.uploadDir, 'avatars', userId);
      await this.ensureDirectoryExists(userDir);
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `avatar_${Date.now()}${ext}`;
      const filepath = path.join(userDir, filename);
      await fs.writeFile(filepath, file.buffer);
      user.avatarFilename = filename;
    }

    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatarFilename: user.avatarFilename,
      designation: user.designation,
      location: user.location,
      faceEmbedding: user.faceEmbedding ? user.faceEmbedding.length > 0 : false,
    };
  }

  async getAvatarPath(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.avatarFilename) throw new NotFoundException('Avatar not found');

    const filepath = path.join(this.uploadDir, 'avatars', userId, user.avatarFilename);
    return { path: filepath, filename: user.avatarFilename };
  }

  async getAllUsers() {
    const users = await this.userModel.find().select('-passwordHash').exec();
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatarFilename: user.avatarFilename,
      designation: user.designation,
      location: user.location,
      createdAt: user.createdAt,
    }));
  }

  async updateUser(userId: string, data: { name?: string; email?: string; role?: string; isActive?: boolean }) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (data.email && data.email !== user.email) {
      const existing = await this.userModel.findOne({ email: data.email }).exec();
      if (existing) throw new ConflictException('Email already in use');
      user.email = data.email.toLowerCase();
    }

    if (data.name) user.name = data.name;
    if (data.role) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      avatarFilename: user.avatarFilename,
      designation: user.designation,
      location: user.location,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User deleted successfully' };
  }

  async createUserByAdmin(data: { name: string; email: string; role?: string }) {
    if (!data.name || !data.email) {
      throw new BadRequestException('Name and email are required');
    }

    const email = data.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const password = this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      name: data.name,
      email,
      passwordHash,
      role: data.role || 'user',
    });

    await user.save();

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      generatedPassword: password,
    };
  }

  private async ensureDirectoryExists(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private generateRandomPassword(length: number = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      result += chars[idx];
    }
    return result;
  }
}
