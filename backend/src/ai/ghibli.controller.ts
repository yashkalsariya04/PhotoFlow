import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AiService } from './ai.service';

@Controller('ai')
export class GhibliController {
  constructor(private readonly aiService: AiService) {}

  @Post('ghibli')
  @UseInterceptors(FileInterceptor('image'))
  async convertToGhibli(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    try {
      const buffer = await this.aiService.generateGhibliArt(file.buffer, file.mimetype || 'image/jpeg');
      res.set({
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-store',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': 'attachment; filename="ghibli.jpg"',
      });
      res.send(buffer);
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpException('Image generation limit reached. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new HttpException('Failed to generate art', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
