import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { SharedLink, SharedLinkDocument } from './schemas/shared-link.schema';
import { PhotosService } from '../photos/photos.service';
import { AlbumsService } from '../albums/albums.service';
import { CreateSharedLinkDto } from './dto';

@Injectable()
export class SharedLinksService {
  constructor(
    @InjectModel(SharedLink.name) private sharedLinkModel: Model<SharedLinkDocument>,
    private photosService: PhotosService,
    private albumsService: AlbumsService,
  ) {}

  /**
   * Create a shareable link for a photo
   */
  async createPhotoShareLink(
    photoId: string,
    userId: string,
    createDto?: CreateSharedLinkDto,
  ) {
    // Verify photo exists and belongs to user
    await this.photosService.getPhotoById(photoId, userId);

    return this.createShareLink('photo', photoId, userId, createDto);
  }

  /**
   * Create a shareable link for an album
   */
  async createAlbumShareLink(
    albumId: string,
    userId: string,
    createDto?: CreateSharedLinkDto,
  ) {
    // Verify album exists and belongs to user
    await this.albumsService.getAlbumById(albumId, userId);

    return this.createShareLink('album', albumId, userId, createDto);
  }

  /**
   * Get resource by share token
   */
  async getSharedResource(token: string) {
    const sharedLink = await this.sharedLinkModel.findOne({ token }).exec();

    if (!sharedLink) {
      throw new NotFoundException('Shared link not found');
    }

    // Check if link has expired
    if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
      throw new BadRequestException('Shared link has expired');
    }

    const userId = sharedLink.userId.toString();

    if (sharedLink.resourceType === 'photo') {
      const photo = await this.photosService.getPhotoById(
        sharedLink.resourceId.toString(),
        userId,
      );
      return {
        type: 'photo',
        data: photo,
        expiresAt: sharedLink.expiresAt,
      };
    } else {
      const album = await this.albumsService.getAlbumById(
        sharedLink.resourceId.toString(),
        userId,
      );
      return {
        type: 'album',
        data: album,
        expiresAt: sharedLink.expiresAt,
      };
    }
  }

  /**
   * Get all shared links for a user
   */
  async getUserSharedLinks(userId: string) {
    const links = await this.sharedLinkModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return links.map((link) => ({
      id: link._id.toString(),
      resourceType: link.resourceType,
      resourceId: link.resourceId.toString(),
      token: link.token,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      url: this.generateShareUrl(link.token),
    }));
  }

  /**
   * Delete a shared link
   */
  async deleteSharedLink(linkId: string, userId: string) {
    if (!Types.ObjectId.isValid(linkId)) {
      throw new BadRequestException('Invalid link ID');
    }

    const result = await this.sharedLinkModel
      .deleteOne({
        _id: new Types.ObjectId(linkId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException('Shared link not found');
    }

    return { message: 'Shared link deleted successfully' };
  }

  /**
   * Create a shareable link
   */
  private async createShareLink(
    resourceType: 'photo' | 'album',
    resourceId: string,
    userId: string,
    createDto?: CreateSharedLinkDto,
  ) {
    // Check if a share link already exists for this resource
    const existingLink = await this.sharedLinkModel
      .findOne({
        resourceType,
        resourceId: new Types.ObjectId(resourceId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (existingLink) {
      // Return existing link
      return {
        id: existingLink._id.toString(),
        token: existingLink.token,
        url: this.generateShareUrl(existingLink.token),
        expiresAt: existingLink.expiresAt,
        createdAt: existingLink.createdAt,
      };
    }

    // Generate unique token
    const token = uuidv4();

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (createDto?.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + createDto.expiresInDays);
    }

    // Create shared link
    const sharedLink = new this.sharedLinkModel({
      resourceType,
      resourceId: new Types.ObjectId(resourceId),
      userId: new Types.ObjectId(userId),
      token,
      expiresAt,
    });

    await sharedLink.save();

    return {
      id: sharedLink._id.toString(),
      token: sharedLink.token,
      url: this.generateShareUrl(sharedLink.token),
      expiresAt: sharedLink.expiresAt,
      createdAt: sharedLink.createdAt,
    };
  }

  /**
   * Generate full share URL
   */
  private generateShareUrl(token: string): string {
    // In production, this would be your frontend URL
    return `/share/${token}`;
  }
}
