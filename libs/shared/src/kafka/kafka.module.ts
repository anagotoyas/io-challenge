import { DynamicModule, Module } from '@nestjs/common';
import { KafkaProducer, KAFKA_CLIENT_ID } from './kafka.producer';

@Module({})
export class KafkaModule {
  static forRoot(clientId: string): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        { provide: KAFKA_CLIENT_ID, useValue: clientId },
        KafkaProducer,
      ],
      exports: [KafkaProducer],
    };
  }
}
