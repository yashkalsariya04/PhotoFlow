import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

// Mock canvas before anything else imports it
try {
  require('canvas');
} catch (e) {
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(path: string) {
    if (path === 'canvas') {
      return {
        _isMock: true,
        Canvas: class {},
        Image: class {},
        ImageData: class {},
        loadImage: async () => { throw new Error('Canvas not available'); }
      };
    }
    if (path === '@tensorflow/tfjs-node') {
      return {};
    }
    return originalRequire.apply(this, arguments);
  };
}

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { Request, Response, NextFunction } from 'express';

if (process.env.http_proxy === 'dev') {
  delete process.env.http_proxy;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.useStaticAssets(join(process.cwd(), 'src', 'photos'), {
    prefix: '/client/photos',
  });
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // This header is REQUIRED for camera access to work on a live (HTTPS) server.
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self)');
    next();
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port, '127.0.0.1');

  console.log('');
  console.log('🚀 PhotoFlow Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`✅ API available at http://localhost:${port}/api`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

bootstrap();
