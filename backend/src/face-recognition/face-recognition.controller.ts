import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceRecognitionService } from './face-recognition.service';

@Controller('face-recognition')
export class FaceRecognitionController {
  constructor(private readonly faceRecognitionService: FaceRecognitionService) {}

  @Get('status')
  getStatus() {
    return {
      status: 'active',
      modelsLoaded: this.faceRecognitionService.isModelsLoaded(),
    };
  }

  @Post('detect')
  @UseInterceptors(FileInterceptor('image'))
  async detectFaces(
    @UploadedFile() file: Express.Multer.File,
    @Query('detector') detector?: 'ssd' | 'tiny' | 'mtcnn',
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    try {
      const result = await this.faceRecognitionService.detectFaces(file.buffer, detector);
      return {
        faceCount: result.faceCount,
        detections: result.detections,
        // We don't return embeddings here as they are large and for internal use
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
