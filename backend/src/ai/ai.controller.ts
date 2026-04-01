import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ghibli')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, cb) => {
        // Only allow image files
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
          return cb(new BadRequestException('Only image files are allowed (JPEG, PNG, WEBP)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async convertToGhibli(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    // Validate file exists
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Validate buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    console.log(`[GhibliController] Received image: ${file.originalname}, size: ${(file.size / 1024).toFixed(1)}KB, type: ${file.mimetype}`);

    try {
      const buffer = await this.aiService.generateGhibliArt(
        file.buffer,
        file.mimetype || 'image/jpeg',
      );

      console.log(`[GhibliController] ✅ Success — output size: ${(buffer.length / 1024).toFixed(1)}KB`);

      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'Content-Disposition': 'attachment; filename="ghibli.jpg"',
        'Content-Length': buffer.length.toString(),
      });

      return res.send(buffer);

    } catch (error: any) {
      const msg = String(error?.message || '');

      console.error('[GhibliController] ❌ Error:', msg);

      // Handle known error types with friendly messages
      if (
        msg.includes('quota exceeded') ||
        msg.includes('free tier') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        error?.status === 429
      ) {
        throw new HttpException(
          'Image generation limit reached. Please try again in a few minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (msg.includes('not configured') || msg.includes('API key')) {
        throw new HttpException(
          'AI service not configured. Please contact support.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error instanceof HttpException) throw error;

      throw new HttpException(
        'Failed to generate Ghibli art. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}