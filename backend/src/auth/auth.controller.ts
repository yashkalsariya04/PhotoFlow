import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RegisterDto, RegisterDtoSchema, LoginDto, LoginDtoSchema } from './dto';
import { z } from 'zod';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators';

const SendPasswordDtoSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(8).max(128),
});

type SendPasswordDto = z.infer<typeof SendPasswordDtoSchema>;

const ForgotPasswordDtoSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  newPassword: z.string().min(8).max(128),
});

type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * POST /auth/register
   */
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('admin-register')
  async adminRegister(
    @Body(new ZodValidationPipe(RegisterDtoSchema)) registerDto: RegisterDto,
  ) {
    return this.authService.adminRegister(registerDto);
  }

  @Post('send-password')
  async sendPassword(
    @Body(new ZodValidationPipe(SendPasswordDtoSchema)) body: SendPasswordDto,
  ) {
    return this.authService.sendPasswordEmail(body.email, body.password);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordDtoSchema)) body: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(body.email, body.newPassword);
  }

  /**
   * Remove Face Enrollment
   * DELETE /auth/enroll-face
   */
  @Delete('enroll-face')
  @UseGuards(JwtAuthGuard)
  async removeFaceEnrollment(@CurrentUser() user: { userId: string }) {
    return this.authService.removeFaceEnrollment(user.userId);
  }

  /**
   * Login user
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginDtoSchema)) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Face Recognition Login
   * POST /auth/face-login
   */
  @Post('face-login')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('selfie'))
  async faceLogin(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Selfie image is required');
    }
    return this.authService.faceLogin(file.buffer);
  }

  /**
   * Enroll Face for Recognition
   * POST /auth/enroll-face
   */
  @Post('enroll-face')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('selfie'))
  async enrollFace(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Selfie image is required');
    }
    return this.authService.enrollFace(req.user.userId, file.buffer);
  }
}
