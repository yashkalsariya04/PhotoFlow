import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { ZodValidationPipe } from '../common/pipes';
import { CreateEventDto, CreateEventDtoSchema, ClientAccessDto, ClientAccessDtoSchema } from './dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Create a new event (photographer only)
   * POST /events
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Body(new ZodValidationPipe(CreateEventDtoSchema)) createEventDto: CreateEventDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.createEvent(createEventDto, user.userId);
  }

  /**
   * Sync photo counts for all events (admin only)
   * POST /events/sync-counts
   */
  @Post('sync-counts')
  @UseGuards(JwtAuthGuard)
  async syncPhotoCounts() {
    // TODO: Add Admin Role Check
    return this.eventsService.syncPhotoCounts();
  }

  /**
   * Get event details by access code (client access - no auth)
   * GET /events/access/:code
   * IMPORTANT: This must come BEFORE /events/:id to avoid route conflicts
   */
  @Get('access/:code')
  async getEventByCode(@Param('code') code: string) {
    return this.eventsService.getEventByAccessCode(code);
  }

  /**
   * Client facial recognition access (no auth)
   * POST /events/access/:code/recognize
   */
  @Post('access/:code/recognize')
  @UseInterceptors(FileInterceptor('selfie'))
  async recognizeFace(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(ClientAccessDtoSchema)) clientAccessDto: ClientAccessDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Selfie image is required');
    }

    return this.eventsService.clientFacialRecognition(code, clientAccessDto, file.buffer);
  }

  @Post('access/validate-selfie')
  @UseInterceptors(FileInterceptor('selfie'))
  async validateSelfie(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Selfie image is required');
    }

    return this.eventsService.validateSelfie(file.buffer);
  }

  /**
   * Get client's matched photos (no auth)
   * GET /events/client/:accessId
   */
  @Get('client/:accessId')
  async getClientPhotos(@Param('accessId') accessId: string) {
    return this.eventsService.getClientPhotos(accessId);
  }

  /**
   * Get all events (admin only)
   * GET /events/all
   */
  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllEvents() {
    // TODO: Add Admin Role Check
    return this.eventsService.getAllEvents();
  }

  /**
   * Delete event
   * DELETE /events/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteEvent(@Param('id') id: string) {
    // TODO: Add Admin/Owner Role Check
    return this.eventsService.deleteEvent(id);
  }

  /**
   * Get all events for photographer
   * GET /events
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getEvents(@CurrentUser() user: { userId: string }) {
    return this.eventsService.getPhotographerEvents(user.userId);
  }

  /**
   * Get event by ID (photographer only)
   * GET /events/:id
   * IMPORTANT: This must come AFTER specific routes like /events/access/:code
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEvent(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.eventsService.getEventById(id, user.userId);
  }

  /**
   * Update event (photographer only)
   * PUT /events/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: any,
    @CurrentUser() user: { userId: string },
  ) {
    return this.eventsService.updateEvent(id, user.userId, updateEventDto);
  }
}
