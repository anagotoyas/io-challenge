import { Module } from '@nestjs/common';
import { ProcessorController } from './processor.controller';
import { ProcessorService } from './processor.service';
import { ProcessorRepository } from './processor.repository';
import { KafkaModule, SharedModule } from '@app/shared';

@Module({
  imports: [SharedModule, KafkaModule.forRoot('card-processor')],
  controllers: [ProcessorController],
  providers: [ProcessorService, ProcessorRepository],
})
export class ProcessorModule {}
