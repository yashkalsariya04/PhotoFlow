import { Controller, Post, Get, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../common/pipes';
import {
  CreateAlbumDto,
  CreateAlbumDtoSchema,
  AddPhotosToAlbumDto,
  AddPhotosToAlbumDtoSchema,
} from './dto';

@Controller('albums')
@UseGuards(JwtAuthGuard)
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  /**
   * Create a new album
   * POST /albums
   */
  @Post()
  async createAlbum(
    @Body(new ZodValidationPipe(CreateAlbumDtoSchema)) createAlbumDto: CreateAlbumDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.albumsService.createAlbum(createAlbumDto, user.userId);
  }

  /**
   * Get all albums for current user
   * GET /albums
   */
  @Get()
  async getAlbums(@CurrentUser() user: { userId: string }) {
    return this.albumsService.getAlbums(user.userId);
  }

  /**
   * Get a single album by ID
   * GET /albums/:id
   */
  @Get(':id')
  async getAlbum(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.albumsService.getAlbumById(id, user.userId);
  }

  /**
   * Add photos to an album
   * POST /albums/:id/photos
   */
  @Post(':id/photos')
  async addPhotos(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddPhotosToAlbumDtoSchema)) addPhotosDto: AddPhotosToAlbumDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.albumsService.addPhotosToAlbum(id, addPhotosDto, user.userId);
  }

  /**
   * Remove photos from an album
   * DELETE /albums/:id/photos
   */
  @Delete(':id/photos')
  async removePhotos(
    @Param('id') id: string,
    @Body() body: { photoIds: string[] },
    @CurrentUser() user: { userId: string },
  ) {
    return this.albumsService.removePhotosFromAlbum(id, body.photoIds, user.userId);
  }
}
