import { Module } from '@nestjs/common';
import { ProcessorController } from './processor.controller';

@Module({
  controllers: [ProcessorController],
})
export class ProcessorModule {}
