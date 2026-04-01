import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProcessorModule } from './processor/processor.module';
import { KafkaModule } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProcessorModule,
    KafkaModule,
  ],
})
export class CardProcessorModule {}
