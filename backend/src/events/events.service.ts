import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';
import { ClientAccess, ClientAccessDocument } from './schemas/client-access.schema';
import { PhotosService } from '../photos/photos.service';
import { FaceRecognitionService } from '../face-recognition/face-recognition.service';
import { CreateEventDto, ClientAccessDto } from './dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(ClientAccess.name) private clientAccessModel: Model<ClientAccessDocument>,
    @Inject(forwardRef(() => PhotosService)) private photosService: PhotosService,
    private faceRecognitionService: FaceRecognitionService,
  ) {}

  /**
   * Create a new event
   */
  async createEvent(createEventDto: CreateEventDto, photographerId: string) {
    const accessCode = this.generateAccessCode();

    const event = new this.eventModel({
      photographerId: new Types.ObjectId(photographerId),
      title: createEventDto.title,
      description: createEventDto.description,
      eventDate: new Date(createEventDto.eventDate),
      accessCode,
    });

    await event.save();

    return {
      event: this.mapEventToResponse(event),
    };
  }

  /**
   * Get all events for a photographer
   */
  async getPhotographerEvents(photographerId: string) {
    const events = await this.eventModel
      .find({ photographerId: new Types.ObjectId(photographerId) })
      .sort({ eventDate: -1 })
      .exec();

    return {
      events: events.map((event) => this.mapEventToResponse(event)),
    };
  }

  /**
   * Get all events (admin only)
   */
  async getAllEvents() {
    const events = await this.eventModel.find().sort({ eventDate: -1 }).exec();
    return {
      events: events.map((event) => this.mapEventToResponse(event)),
    };
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string) {
    if (!eventId) {
        throw new BadRequestException('Event ID is required');
    }
    
    const cleanId = eventId.trim();
    
    if (!Types.ObjectId.isValid(cleanId)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel.findByIdAndDelete(cleanId).exec();
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Also delete associated client access records
    await this.clientAccessModel.deleteMany({ eventId: new Types.ObjectId(cleanId) }).exec();

    // Note: Photos should also be deleted, but we'll leave that for the PhotosService cleanup
    
    return { message: 'Event deleted successfully' };
  }

  /**
   * Get event by ID (photographer only)
   */
  async getEventById(eventId: string, photographerId: string) {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel
      .findOne({
        _id: new Types.ObjectId(eventId),
        photographerId: new Types.ObjectId(photographerId),
      })
      .exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      event: this.mapEventToResponse(event),
    };
  }

  /**
   * Update event (photographer only)
   */
  async updateEvent(
    eventId: string,
    photographerId: string,
    updateData: { 
      title?: string; 
      description?: string; 
      eventDate?: string; 
      isActive?: boolean;
    },
  ) {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid event ID');
    }

    const event = await this.eventModel.findOne({
      _id: new Types.ObjectId(eventId),
      photographerId: new Types.ObjectId(photographerId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Update fields
    if (updateData.title) event.title = updateData.title;
    if (updateData.description) event.description = updateData.description;
    if (updateData.eventDate) event.eventDate = new Date(updateData.eventDate);
    if (updateData.isActive !== undefined) event.isActive = updateData.isActive;

    await event.save();

    return {
      event: this.mapEventToResponse(event),
    };
  }

  /**
   * Get event by access code (client access)
   */
  async getEventByAccessCode(accessCode: string) {
    const event = await this.eventModel.findOne({ accessCode, isActive: true }).exec();

    if (!event) {
      throw new NotFoundException('Event not found or inactive');
    }

    return {
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      photoCount: event.photoCount,
    };
  }

  /**
   * Client facial recognition access
   */
  async clientFacialRecognition(
    accessCode: string,
    clientAccessDto: ClientAccessDto,
    selfieBuffer: Buffer,
  ) {
    // Get event by access code
    const event = await this.eventModel.findOne({ accessCode, isActive: true }).exec();
    if (!event) {
      throw new NotFoundException('Event not found or inactive');
    }

    try {
      const startTime = Date.now();
      const result = await this.faceRecognitionService.detectFaces(selfieBuffer, 'tiny');
      const detectionTime = Date.now() - startTime;
      
      if (result.faceCount === 0) {
        throw new BadRequestException('No face detected in selfie. Please upload a clear photo of your face.');
      }

      this.logger.log(`Face detection took ${detectionTime}ms for selfie`);

      // Get all photos with face embeddings for this event
      const photoEmbeddings = await this.photosService.getEventPhotosWithFaceEmbeddings(
        event._id.toString(),
        event.photographerId.toString()
      );

      // Search for matches for ALL detected faces in the selfie
      // This solves the issue where users upload photos with multiple people (e.g. couples)
      const allMatchedPhotoIdsSet = new Set<string>();
      let totalFaceMatches = 0;
      const matchingStartTime = Date.now();

      // Filter faces to avoid matching background people
      // We take the largest face and any other faces that are at least 50% of its size
      const primaryFaces = result.detections.length > 0 
        ? result.embeddings.filter((_, index) => {
            if (index === 0) return true; // Always keep the largest face
            const largestArea = result.detections[0].box.width * result.detections[0].box.height;
            const currentArea = result.detections[index].box.width * result.detections[index].box.height;
            return currentArea >= largestArea * 0.5; // Keep if at least 50% of the largest face's area
          })
        : [];

      this.logger.log(`Using ${primaryFaces.length} primary faces from selfie (out of ${result.faceCount} detected)`);

      for (const embedding of primaryFaces) {
        // Use the default threshold from FaceRecognitionService (0.45)
        const matches = await this.faceRecognitionService.findMatches(
          embedding,
          photoEmbeddings
        );
        matches.forEach(id => allMatchedPhotoIdsSet.add(id));
        totalFaceMatches += matches.length;
      }

      const matchingDuration = Date.now() - matchingStartTime;
      const allMatchedPhotoIds = Array.from(allMatchedPhotoIdsSet);

      this.logger.log(`Overall matching for ${result.faceCount} faces took ${matchingDuration}ms. Found ${allMatchedPhotoIds.length} unique photos.`);

      // Create client access record
      const clientAccess = new this.clientAccessModel({
        eventId: event._id,
        clientName: clientAccessDto.clientName,
        clientEmail: clientAccessDto.clientEmail,
        clientPhone: clientAccessDto.clientPhone,
        matchedPhotoIds: allMatchedPhotoIds,
        matchedPhotoCount: allMatchedPhotoIds.length,
        lastAccessedAt: new Date(),
      });

      await clientAccess.save();

      // Update event client access count
      await this.eventModel.updateOne(
        { _id: event._id },
        { $inc: { clientAccessCount: 1 } }
      );

      return {
        clientAccess: {
          _id: clientAccess._id.toString(),
          eventId: clientAccess.eventId.toString(),
          clientName: clientAccess.clientName,
          clientEmail: clientAccess.clientEmail,
          clientPhone: clientAccess.clientPhone,
          matchedPhotoCount: clientAccess.matchedPhotoCount,
          lastAccessedAt: clientAccess.lastAccessedAt,
        },
        matchedPhotoCount: allMatchedPhotoIds.length,
        faceMatches: totalFaceMatches,
        detectedFaces: result.faceCount,
        processingTimeMs: {
          detection: detectionTime,
          matching: matchingDuration,
          total: Date.now() - startTime
        }
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Face recognition failed');
    }
  }

  async validateSelfie(selfieBuffer: Buffer) {
    const result = await this.faceRecognitionService.detectFaces(selfieBuffer, 'tiny', true);

    if (result.faceCount === 0) {
      throw new BadRequestException('No face detected in selfie. Please upload a clear photo of your face.');
    }

    // Relaxed check: Allow multiple faces, but warn or just proceed with the primary one.
    // The actual recognition will use the largest face detected.
    return { faceCount: result.faceCount };
  }

  /**
   * Get client's matched photos
   */
  async getClientPhotos(clientAccessId: string) {
    if (!Types.ObjectId.isValid(clientAccessId)) {
      throw new BadRequestException('Invalid access ID');
    }

    const clientAccess = await this.clientAccessModel
      .findById(clientAccessId)
      .populate('eventId')
      .exec();

    if (!clientAccess) {
      throw new NotFoundException('Access record not found');
    }

    const event = clientAccess.eventId as any;
    const matchedPhotos = await this.photosService.getPhotosByIds(
      clientAccess.matchedPhotoIds.map((id) => id.toString()),
      event.photographerId.toString(),
    );

    return {
      clientAccess: {
        _id: clientAccess._id.toString(),
        eventId: clientAccess.eventId._id.toString(),
        clientName: clientAccess.clientName,
        clientEmail: clientAccess.clientEmail,
        clientPhone: clientAccess.clientPhone,
        matchedPhotoCount: clientAccess.matchedPhotoCount,
        lastAccessedAt: clientAccess.lastAccessedAt,
        eventTitle: event.title,
        eventDate: event.eventDate,
      },
      photos: matchedPhotos,
    };
  }

  /**
   * Update event photo count
   */
  async incrementPhotoCount(eventId: string) {
    await this.eventModel.updateOne(
      { _id: new Types.ObjectId(eventId) },
      { $inc: { photoCount: 1 } },
    );
  }

  /**
   * Decrement event photo count
   */
  async decrementPhotoCount(eventId: string, amount: number = 1) {
    await this.eventModel.updateOne(
      { _id: new Types.ObjectId(eventId) },
      { $inc: { photoCount: -Math.abs(amount) } },
    );
  }

  /**
   * Sync photo counts for all events
   * (Admin utility to fix data inconsistencies)
   */
  async syncPhotoCounts() {
    const events = await this.eventModel.find().exec();
    let updated = 0;

    for (const event of events) {
      const count = await this.photosService.countEventPhotos(event._id.toString());
      if (event.photoCount !== count) {
        event.photoCount = count;
        await event.save();
        updated++;
      }
    }

    return { 
      message: 'Photo counts synced successfully', 
      totalEvents: events.length, 
      updatedEvents: updated 
    };
  }

  /**
   * Generate unique access code
   */
  private generateAccessCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  /**
   * Map event to response
   */
  private mapEventToResponse(event: EventDocument) {
    return {
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      accessCode: event.accessCode,
      isActive: event.isActive,
      photoCount: event.photoCount,
      clientAccessCount: event.clientAccessCount,
      createdAt: event.createdAt,
      photographerId: event.photographerId ? event.photographerId.toString() : null,
    };
  }
}
