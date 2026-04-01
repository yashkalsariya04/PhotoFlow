import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Photo, PhotoDocument } from './schemas/photo.schema';
import { AiService } from '../ai/ai.service';
import { FaceRecognitionService } from '../face-recognition/face-recognition.service';
import { EventsService } from '../events/events.service';

const exifParser = require('exif-parser');

@Injectable()
export class PhotosService {
  private readonly logger = new Logger(PhotosService.name);
  private uploadDir: string;

  constructor(
    @InjectModel(Photo.name) private photoModel: Model<PhotoDocument>,
    private aiService: AiService,
    private faceRecognitionService: FaceRecognitionService,
    private configService: ConfigService,
    @Inject(forwardRef(() => EventsService)) private eventsService: EventsService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
  }

  /**
   * Upload a photo with processing
   */
  async uploadPhoto(file: Express.Multer.File, userId: string, eventId?: string) {
    const storageLimitGb = this.configService.get<number>('STORAGE_LIMIT_GB') || 10;
    const storageLimitBytes = storageLimitGb * 1024 * 1024 * 1024;
    const currentUsage = await this.getUserStorageUsage(userId);
    if (currentUsage.totalBytes + file.size > storageLimitBytes) {
      throw new BadRequestException(`Storage limit of ${storageLimitGb}GB exceeded. Cannot upload new photos.`);
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Create user-specific upload directory
    const userUploadDir = path.join(this.uploadDir, userId);
    await this.ensureDirectoryExists(userUploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}${ext}`;
    const filepath = path.join(userUploadDir, filename);

    // Prepare separate buffers for fast detection and storage
    const detectionBuffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const storageBuffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Process face recognition BEFORE saving the file, using the smaller buffer
    let faceEmbeddings: number[][] = [];
    let faceBoxes: any[] = [];
    let faceCount = 0;
    const faceStartTime = Date.now();
    
    try {
      const faceResult = await this.faceRecognitionService.detectFaces(detectionBuffer, 'tiny');
      faceEmbeddings = faceResult.embeddings.map(emb => Array.from(emb));
      faceBoxes = faceResult.detections;
      faceCount = faceResult.faceCount;
      const faceDuration = Date.now() - faceStartTime;
      this.logger.log(`Face detection for uploaded photo took ${faceDuration}ms. Found ${faceCount} faces.`);

      if (faceCount === 0) {
        throw new BadRequestException('No faces detected in the photo. Only photos with faces are allowed for this event.');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // Face recognition logic failed, but it's not a "no face" error. 
      // We'll log it and continue as optional.
      this.logger.warn(`Face processing failed: ${error.message}`);
    }

    // Now save the file since we've confirmed there's a face
    await fs.writeFile(filepath, storageBuffer);

    // Extract EXIF metadata
    const metadata = await this.extractMetadata(file.buffer);

    // Get image dimensions from stored image
    const imageInfo = await sharp(storageBuffer).metadata();
    const width = imageInfo.width || 0;
    const height = imageInfo.height || 0;
    (metadata as any).imageSize = { width, height };

    // Generate thumbnail
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(userUploadDir, thumbnailFilename);
    await sharp(storageBuffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    // Generate AI tags
    const tags = await this.aiService.generateTags(file.buffer, metadata);

    // Create photo record
    const photo = new this.photoModel({
      userId: new Types.ObjectId(userId),
      eventId: eventId ? new Types.ObjectId(eventId) : undefined,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      width,
      height,
      metadata,
      tags,
      faceEmbeddings,
      faceBoxes,
      faceCount,
      thumbnailFilename,
    });

    await photo.save();

    // Increment event photo count if part of an event
    if (eventId) {
      await this.eventsService.incrementPhotoCount(eventId);
    }

    return this.mapPhotoToResponse(photo);
  }

  /**
   * Get all photos for a user with pagination and filters
   */
  async getPhotos(userId: string, page = 1, limit = 20, tags?: string) {
    const query: any = { userId: new Types.ObjectId(userId) };

    // Filter by tags if provided
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      this.photoModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.photoModel.countDocuments(query).exec(),
    ]);

    return {
      photos: photos.map((photo) => this.mapPhotoToResponse(photo)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Count photos for an event
   */
  async countEventPhotos(eventId: string) {
    if (!Types.ObjectId.isValid(eventId)) {
      return 0;
    }
    return this.photoModel.countDocuments({ eventId: new Types.ObjectId(eventId) }).exec();
  }

  async getUserStorageUsage(userId: string) {
    const photos = await this.photoModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('size')
      .exec();

    let totalBytes = 0;

    for (const photo of photos) {
      if (photo.size && photo.size > 0) {
        totalBytes += photo.size;
      }
    }

    return {
      totalBytes,
      photoCount: photos.length,
    };
  }

  /**
   * Get a single photo document by ID (internal use)
   */
  async getPhotoDocumentById(photoId: string, userId?: string) {
    if (!Types.ObjectId.isValid(photoId)) {
      throw new BadRequestException('Invalid photo ID');
    }

    const query: any = { _id: new Types.ObjectId(photoId) };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const photo = await this.photoModel.findOne(query).exec();

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return photo;
  }

  /**
   * Get a single photo by ID
   */
  async getPhotoById(photoId: string, userId?: string) {
    const photo = await this.getPhotoDocumentById(photoId, userId);
    return this.mapPhotoToResponse(photo);
  }

  /**
   * Get photo file path
   */
  async getPhotoFilePath(photoId: string, userId?: string, thumbnail = false) {
    const photo = await this.getPhotoDocumentById(photoId, userId);
    const filename = thumbnail ? photo.thumbnailFilename : photo.filename;
    // Use the photo's owner ID to locate the file
    return path.join(this.uploadDir, photo.userId.toString(), filename);
  }

  /**
   * Get file path for a photo (public access for clients)
   */
  async getPublicPhotoFilePath(photoId: string, isThumbnail = false): Promise<string> {
    const photo = await this.photoModel.findById(photoId).exec();
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const filename = isThumbnail ? photo.thumbnailFilename : photo.filename;
    const userId = photo.userId.toString();
    return path.join(this.uploadDir, userId, filename);
  }

  /**
   * Get photos by IDs (used by albums)
   */
  async getPhotosByIds(photoIds: string[], userId: string) {
    const objectIds = photoIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const photos = await this.photoModel
      .find({
        _id: { $in: objectIds },
        userId: new Types.ObjectId(userId),
      })
      .exec();

    return photos.map((photo) => this.mapPhotoToResponse(photo));
  }

  /**
   * Get photos by tags (used by smart albums)
   */
  async getPhotosByTags(tags: string[], userId: string) {
    const photos = await this.photoModel
      .find({
        userId: new Types.ObjectId(userId),
        tags: { $in: tags },
      })
      .sort({ createdAt: -1 })
      .exec();

    return photos.map((photo) => this.mapPhotoToResponse(photo));
  }

  /**
   * Get photos for an event with face embeddings
   */
  async getEventPhotosWithFaceEmbeddings(eventId: string, userId: string) {
    const photos = await this.photoModel
      .find({
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId),
        faceCount: { $gt: 0 }, // Only photos with detected faces
      })
      .select('faceEmbeddings faceBoxes')
      .exec();

    return photos.map(photo => ({
      photoId: photo._id.toString(),
      embeddings: photo.faceEmbeddings.map(emb => new Float32Array(emb)),
      faceBoxes: (photo as any).faceBoxes || [],
    }));
  }

  /**
   * Get event photos
   */
  async getEventPhotos(eventId: string, userId?: string, page = 1, limit = 50) {
    const cleanEventId = eventId.trim();
    if (!Types.ObjectId.isValid(cleanEventId)) {
      throw new BadRequestException('Invalid event ID');
    }

    const query: any = {
      eventId: new Types.ObjectId(cleanEventId),
    };

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      this.photoModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.photoModel.countDocuments(query).exec(),
    ]);

    return {
      photos: photos.map((photo) => this.mapPhotoToResponse(photo)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a single photo (and its files)
   */
  async deletePhoto(photoId: string, userId?: string) {
    const photo = await this.getPhotoDocumentById(photoId, userId);
    const mainPath = await this.getPhotoFilePath(photoId, userId, false);
    const thumbPath = await this.getPhotoFilePath(photoId, userId, true);
    try { await fs.unlink(mainPath); } catch {}
    try { await fs.unlink(thumbPath); } catch {}
    await this.photoModel.deleteOne({ _id: new Types.ObjectId(photoId) }).exec();
    if (photo.eventId) {
      await this.eventsService.decrementPhotoCount(photo.eventId.toString(), 1);
    }
    return { success: true, photoId: photoId.toString() };
  }

  /**
   * Batch delete photos
   */
  async deletePhotos(photoIds: string[], userId?: string) {
    const results = [];
    const eventDecrements = new Map<string, number>();

    for (const id of photoIds) {
      try {
        const photo = await this.getPhotoDocumentById(id, userId);
        const mainPath = await this.getPhotoFilePath(id, userId, false);
        const thumbPath = await this.getPhotoFilePath(id, userId, true);
        
        try { await fs.unlink(mainPath); } catch {}
        try { await fs.unlink(thumbPath); } catch {}
        
        await this.photoModel.deleteOne({ _id: photo._id }).exec();
        
        if (photo.eventId) {
          const eventIdStr = photo.eventId.toString();
          eventDecrements.set(eventIdStr, (eventDecrements.get(eventIdStr) || 0) + 1);
        }

        results.push({ id, success: true });
      } catch (e) {
        results.push({ id, success: false, message: (e as Error).message });
      }
    }

    // Apply decrements in bulk for each event
    for (const [eventId, amount] of eventDecrements.entries()) {
      await this.eventsService.decrementPhotoCount(eventId, amount);
    }

    const deleted = results.filter(r => r.success).length;
    return { success: true, deleted, total: photoIds.length, results };
  }

  /**
   * Extract EXIF metadata from image buffer
   */
  private async extractMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      return {
        exif: result.tags || {},
        imageSize: result.imageSize || {},
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dir: string) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Map photo document to response format
   */
  private mapPhotoToResponse(photo: PhotoDocument) {
    return {
      id: photo._id.toString(),
      _id: photo._id.toString(),
      eventId: photo.eventId?.toString(),
      filename: photo.filename,
      originalName: photo.originalName,
      mimeType: photo.mimeType,
      size: photo.size,
      width: photo.width,
      height: photo.height,
      metadata: photo.metadata,
      tags: photo.tags,
      faceBoxes: (photo as any).faceBoxes || [],
      thumbnailFilename: photo.thumbnailFilename,
      thumbnailUrl: `/api/photos/${photo._id.toString()}/thumbnail/public`,
      faceCount: (photo as any).faceCount || 0,
      createdAt: photo.createdAt,
    };
  }
}
