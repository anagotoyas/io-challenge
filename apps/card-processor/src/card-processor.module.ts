import { Module } from '@nestjs/common';
import { CardProcessorController } from './card-processor.controller';
import { CardProcessorService } from './card-processor.service';

@Module({
  imports: [],
  controllers: [CardProcessorController],
  providers: [CardProcessorService],
})
export class CardProcessorModule {}
