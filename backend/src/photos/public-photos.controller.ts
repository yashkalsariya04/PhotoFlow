import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { PhotosService } from './photos.service';

@Controller('photos')
export class PublicPhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * Get public photo thumbnail (for client access)
   * GET /photos/:id/thumbnail/public
   */
  @Get(':id/thumbnail/public')
  async getPublicThumbnail(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const filepath = await this.photosService.getPublicPhotoFilePath(id, true);
      const fileBuffer = await fs.readFile(filepath);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });
      
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ message: 'Photo not found' });
    }
  }

  /**
   * Get public photo (for client access)
   * GET /photos/:id/public
   */
  @Get(':id/public')
  async getPublicPhoto(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const filepath = await this.photosService.getPublicPhotoFilePath(id, false);
      const fileBuffer = await fs.readFile(filepath);
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': 'attachment',
      });
      
      res.send(fileBuffer);
    } catch (error) {
      res.status(404).json({ message: 'Photo not found' });
    }
  }
}
