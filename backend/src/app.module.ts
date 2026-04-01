import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { PhotosModule } from './photos/photos.module';
import { AlbumsModule } from './albums/albums.module';
import { SharedLinksModule } from './shared-links/shared-links.module';
import { EventsModule } from './events/events.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
    }),
    DatabaseModule,
    AuthModule,
    PhotosModule,
    EventsModule,
    AlbumsModule,
    SharedLinksModule,
    AiModule,
    FaceRecognitionModule,
    SeedModule,
    // UsersModule provides profile endpoints
    UsersModule,
  ],
})
export class AppModule {}
