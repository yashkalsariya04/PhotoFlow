import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GhibliController } from './ghibli.controller';

@Module({
  controllers: [GhibliController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
