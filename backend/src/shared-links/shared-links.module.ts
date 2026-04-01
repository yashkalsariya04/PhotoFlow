import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedLinksController } from './shared-links.controller';
import { SharedLinksService } from './shared-links.service';
import { SharedLink, SharedLinkSchema } from './schemas/shared-link.schema';
import { PhotosModule } from '../photos/photos.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SharedLink.name, schema: SharedLinkSchema }]),
    PhotosModule,
    AlbumsModule,
  ],
  controllers: [SharedLinksController],
  providers: [SharedLinksService],
  exports: [SharedLinksService],
})
export class SharedLinksModule {}
