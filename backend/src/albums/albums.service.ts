import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Album, AlbumDocument } from './schemas/album.schema';
import { PhotosService } from '../photos/photos.service';
import { CreateAlbumDto, AddPhotosToAlbumDto } from './dto';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    private photosService: PhotosService,
  ) {}

  /**
   * Create a new album (manual or smart)
   */
  async createAlbum(createAlbumDto: CreateAlbumDto, userId: string) {
    const { title, isSmart, tagRules, photoIds } = createAlbumDto;

    // Validate smart album rules
    if (isSmart && (!tagRules || tagRules.length === 0)) {
      throw new BadRequestException('Smart albums require at least one tag rule');
    }

    // Validate manual album photos
    if (!isSmart && photoIds && photoIds.length > 0) {
      const validPhotoIds = photoIds.filter((id) => Types.ObjectId.isValid(id));
      if (validPhotoIds.length !== photoIds.length) {
        throw new BadRequestException('Some photo IDs are invalid');
      }
    }

    const album = new this.albumModel({
      userId: new Types.ObjectId(userId),
      title,
      isSmart,
      tagRules: isSmart ? tagRules : [],
      photoIds: isSmart ? [] : photoIds.map((id) => new Types.ObjectId(id)),
    });

    await album.save();

    return this.getAlbumWithPhotos(album, userId);
  }

  /**
   * Get all albums for a user
   */
  async getAlbums(userId: string) {
    const albums = await this.albumModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(albums.map((album) => this.getAlbumWithPhotos(album, userId)));
  }

  /**
   * Get a single album by ID
   */
  async getAlbumById(albumId: string, userId: string) {
    if (!Types.ObjectId.isValid(albumId)) {
      throw new BadRequestException('Invalid album ID');
    }

    const album = await this.albumModel
      .findOne({
        _id: new Types.ObjectId(albumId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return this.getAlbumWithPhotos(album, userId);
  }

  /**
   * Add photos to a manual album
   */
  async addPhotosToAlbum(albumId: string, addPhotosDto: AddPhotosToAlbumDto, userId: string) {
    if (!Types.ObjectId.isValid(albumId)) {
      throw new BadRequestException('Invalid album ID');
    }

    const album = await this.albumModel
      .findOne({
        _id: new Types.ObjectId(albumId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.isSmart) {
      throw new BadRequestException('Cannot manually add photos to smart albums');
    }

    // Validate photo IDs
    const validPhotoIds = addPhotosDto.photoIds.filter((id) => Types.ObjectId.isValid(id));
    if (validPhotoIds.length !== addPhotosDto.photoIds.length) {
      throw new BadRequestException('Some photo IDs are invalid');
    }

    // Add new photo IDs (avoiding duplicates)
    const newPhotoIds = validPhotoIds
      .map((id) => new Types.ObjectId(id))
      .filter((id) => !album.photoIds.some((existingId) => existingId.equals(id)));

    album.photoIds.push(...newPhotoIds);
    await album.save();

    return this.getAlbumWithPhotos(album, userId);
  }

  /**
   * Remove photos from a manual album
   */
  async removePhotosFromAlbum(albumId: string, photoIds: string[], userId: string) {
    if (!Types.ObjectId.isValid(albumId)) {
      throw new BadRequestException('Invalid album ID');
    }

    const album = await this.albumModel
      .findOne({
        _id: new Types.ObjectId(albumId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.isSmart) {
      throw new BadRequestException('Cannot manually remove photos from smart albums');
    }

    // Remove specified photo IDs
    const idsToRemove = photoIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    album.photoIds = album.photoIds.filter(
      (photoId) => !idsToRemove.some((removeId) => removeId.equals(photoId)),
    );

    await album.save();

    return this.getAlbumWithPhotos(album, userId);
  }

  /**
   * Get album with photos populated
   * For smart albums, dynamically fetch photos matching tag rules
   */
  private async getAlbumWithPhotos(album: AlbumDocument, userId: string) {
    let photos;

    if (album.isSmart) {
      // Smart album: fetch photos by tags
      photos = await this.photosService.getPhotosByTags(album.tagRules, userId);
    } else {
      // Manual album: fetch photos by IDs
      const photoIdStrings = album.photoIds.map((id) => id.toString());
      photos = await this.photosService.getPhotosByIds(photoIdStrings, userId);
    }

    return {
      id: album._id.toString(),
      title: album.title,
      isSmart: album.isSmart,
      tagRules: album.tagRules,
      photoCount: photos.length,
      photos,
      createdAt: album.createdAt,
    };
  }
}
