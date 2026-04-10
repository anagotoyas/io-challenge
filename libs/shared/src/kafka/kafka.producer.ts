import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { CloudEvent } from '../types/cloud-event.types';
import { EventType } from '../types/event-type.types';

export const KAFKA_CLIENT_ID = 'KAFKA_CLIENT_ID';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer: Producer;
  private eventCounter = 0;

  constructor(
    private readonly config: ConfigService,
    @Inject(KAFKA_CLIENT_ID) private readonly clientId: string,
  ) {
    const kafka = new Kafka({
      clientId,
      brokers: [this.config.getOrThrow<string>('KAFKA_BROKER')],
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log({ clientId: this.clientId }, 'Kafka producer conectado');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish<T>(
    topic: string,
    event: Omit<CloudEvent<T>, 'id' | 'time'> & { type: EventType },
  ): Promise<void> {
    const fullEvent: CloudEvent<T> = {
      ...event,
      id: ++this.eventCounter,
      time: new Date().toISOString(),
    };

    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(fullEvent) }],
    });

    this.logger.log(
      {
        topic,
        type: fullEvent.type,
        id: fullEvent.id,
        source: fullEvent.source,
      },
      'Evento publicado',
    );
  }
}
