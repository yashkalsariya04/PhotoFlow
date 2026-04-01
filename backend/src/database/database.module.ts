import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let uri = configService.get<string>('MONGODB_URI');
        const useMemoryDb = configService.get<string>('USE_MEMORY_DB');
        
        // Only use memory DB if explicitly enabled
        const shouldRunMemoryDb = useMemoryDb === 'true';

        if (shouldRunMemoryDb) {
          try {
            console.log('🧠 Starting MongoDB Memory Server...');
            const mongod = await MongoMemoryServer.create({
              binary: {
                version: '7.0.3', // Explicit version
              }
            });
            uri = mongod.getUri();
            console.log(`🧠 MongoDB Memory Server started at ${uri}`);
          } catch (error) {
            console.error('❌ Failed to start MongoDB Memory Server:', error);
          }
        }

        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => {
              console.log('✅ MongoDB connected successfully');
            });
            connection.on('error', (error: Error) => {
              console.error('❌ MongoDB connection error:', error);
            });
            connection.on('disconnected', () => {
              console.log('⚠️  MongoDB disconnected');
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
