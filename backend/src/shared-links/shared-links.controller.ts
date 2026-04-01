import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SharedLinksService } from './shared-links.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../common/pipes';
import { CreateSharedLinkDto, CreateSharedLinkDtoSchema } from './dto';

@Controller('share')
export class SharedLinksController {
  constructor(private readonly sharedLinksService: SharedLinksService) {}

  /**
   * Create a shareable link for a photo
   * POST /share/photo/:id
   */
  @Post('photo/:id')
  @UseGuards(JwtAuthGuard)
  async sharePhoto(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateSharedLinkDtoSchema)) createDto: CreateSharedLinkDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.sharedLinksService.createPhotoShareLink(id, user.userId, createDto);
  }

  /**
   * Create a shareable link for an album
   * POST /share/album/:id
   */
  @Post('album/:id')
  @UseGuards(JwtAuthGuard)
  async shareAlbum(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateSharedLinkDtoSchema)) createDto: CreateSharedLinkDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.sharedLinksService.createAlbumShareLink(id, user.userId, createDto);
  }

  /**
   * Get shared resource by token (public endpoint)
   * GET /share/:token
   */
  @Get(':token')
  async getSharedResource(@Param('token') token: string) {
    return this.sharedLinksService.getSharedResource(token);
  }

  /**
   * Get all shared links for current user
   * GET /share
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserSharedLinks(@CurrentUser() user: { userId: string }) {
    return this.sharedLinksService.getUserSharedLinks(user.userId);
  }

  /**
   * Delete a shared link
   * DELETE /share/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteSharedLink(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.sharedLinksService.deleteSharedLink(id, user.userId);
  }
}
