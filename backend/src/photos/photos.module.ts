import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotosController } from './photos.controller';
import { PublicPhotosController } from './public-photos.controller';
import { PhotosService } from './photos.service';
import { Photo, PhotoSchema } from './schemas/photo.schema';
import { AiModule } from '../ai/ai.module';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Photo.name, schema: PhotoSchema }]),
    AiModule,
    FaceRecognitionModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [PhotosController, PublicPhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
