import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { PhotosService } from './photos.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../common/pipes';
import { GetPhotosQuery, GetPhotosQuerySchema } from './dto';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * Upload a photo
   * POST /photos/upload
   * Optional: eventId in body for event photos
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body('eventId') eventId: string,
    @CurrentUser() user: { userId: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.photosService.uploadPhoto(file, user.userId, eventId);
  }

  /**
   * Get all photos for current user
   * GET /photos
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getPhotos(
    @Query(new ZodValidationPipe(GetPhotosQuerySchema)) query: GetPhotosQuery,
    @CurrentUser() user: { userId: string },
  ) {
    return this.photosService.getPhotos(user.userId, query.page, query.limit, query.tags);
  }

  @Get('storage/usage')
  @UseGuards(JwtAuthGuard)
  async getStorageUsage(@CurrentUser() user: { userId: string }) {
    return this.photosService.getUserStorageUsage(user.userId);
  }

  /**
   * Get a single photo by ID
   * GET /photos/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPhoto(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
    const userId = user.role === 'admin' ? undefined : user.userId;
    return this.photosService.getPhotoById(id, userId);
  }

  /**
   * Download photo file
   * GET /photos/:id/download
   */
  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async downloadPhoto(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: string },
    @Res() res: Response,
  ) {
    const userId = user.role === 'admin' ? undefined : user.userId;
    const filepath = await this.photosService.getPhotoFilePath(id, userId);
    const fileBuffer = await fs.readFile(filepath);
    
    res.set({
      'Content-Type': 'image/jpeg',
    });
    
    res.send(fileBuffer);
  }

  /**
   * Get photo thumbnail
   * GET /photos/:id/thumbnail
   */
  @Get(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  async getThumbnail(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: string },
    @Res() res: Response,
  ) {
    const userId = user.role === 'admin' ? undefined : user.userId;
    const filepath = await this.photosService.getPhotoFilePath(id, userId, true);
    const fileBuffer = await fs.readFile(filepath);
    
    res.set({
      'Content-Type': 'image/jpeg',
    });
    
    res.send(fileBuffer);
  }

  
  /**
   * Get event photos
   * GET /photos/event/:eventId
   */
  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard)
  async getEventPhotos(
    @Param('eventId') eventId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 1000;
    
    // Check if user is admin (case insensitive)
    const isAdmin = user.role && user.role.toLowerCase() === 'admin';
    const userId = isAdmin ? undefined : user.userId;
    
    return this.photosService.getEventPhotos(eventId, userId, pageNum, limitNum);
  }

  /**
   * Delete a photo
   * DELETE /photos/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
    const userId = user.role === 'admin' ? undefined : user.userId;
    return this.photosService.deletePhoto(id, userId);
  }

  /**
   * Delete multiple photos
   * POST /photos/bulk-delete
   */
  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard)
  async deletePhotos(
    @Body() body: { photoIds: string[] },
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const isAdmin = user.role && user.role.toLowerCase() === 'admin';
    const userId = isAdmin ? undefined : user.userId;
    return this.photosService.deletePhotos(body.photoIds || [], userId);
  }

  /**
   * Get photo thumbnail (Public)
   * GET /photos/:id/thumbnail/public
   */
  @Get(':id/thumbnail/public')
  async getPublicThumbnail(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const filepath = await this.photosService.getPhotoFilePath(id, undefined, true);
    const fileBuffer = await fs.readFile(filepath);
    
    res.set({
      'Content-Type': 'image/jpeg',
    });
    
    res.send(fileBuffer);
  }

  /**
   * Get full photo (Public)
   * GET /photos/:id/public
   */
  @Get(':id/public')
  async getPublicPhoto(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const filepath = await this.photosService.getPhotoFilePath(id, undefined, false);
    const fileBuffer = await fs.readFile(filepath);
    
    res.set({
      'Content-Type': 'image/jpeg',
    });
    
    res.send(fileBuffer);
  }
}
