import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, EventSchema } from './schemas/event.schema';
import { ClientAccess, ClientAccessSchema } from './schemas/client-access.schema';
import { PhotosModule } from '../photos/photos.module';
import { AiModule } from '../ai/ai.module';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: ClientAccess.name, schema: ClientAccessSchema },
    ]),
    forwardRef(() => PhotosModule),
    AiModule,
    FaceRecognitionModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
