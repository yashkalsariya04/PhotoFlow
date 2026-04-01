import {
  Controller,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Get,
  Param,
  Res,
  Delete,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService, private configService: ConfigService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.usersService.getProfile(user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllUsers() {
    // TODO: Add Admin Role Check
    return this.usersService.getAllUsers();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string) {
    // TODO: Add Admin Role Check
    return this.usersService.deleteUser(id);
  }

  @Post('admin-create')
  async adminCreateUser(
    @Body() body: { name: string; email: string; role?: string },
  ) {
    return this.usersService.createUserByAdmin(body);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() body: { name?: string; email?: string; designation?: string; location?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(user.userId, body, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; role?: string; isActive?: boolean },
  ) {
    // TODO: Add Admin Role Check
    return this.usersService.updateUser(id, body);
  }

  @Get(':id/avatar')
  async getAvatar(@Param('id') id: string, @Res() res: Response) {

    const uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    const { path: filepath } = await this.usersService.getAvatarPath(id);

    // send file if exists
    try {
      // Using absolute path
      return res.sendFile(path.resolve(filepath));
    } catch (err) {
      return res.status(404).send('Not found');
    }
  }
}
