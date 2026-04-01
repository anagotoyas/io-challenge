import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProcessorModule } from './processor/processor.module';
import { LoggerModule } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ProcessorModule,
  ],
})
export class CardProcessorModule {}
