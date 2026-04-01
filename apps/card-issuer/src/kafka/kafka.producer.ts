import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { CloudEvent } from '@app/shared';

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducer.name);
  private producer: Producer;
  private eventCounter = 0;

  constructor(private readonly config: ConfigService) {
    const kafka = new Kafka({
      clientId: 'card-issuer',
      brokers: [this.config.get<string>('KAFKA_BROKER') || 'localhost:9092'],
    });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer conectado');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish<T>(
    topic: string,
    event: Omit<CloudEvent<T>, 'id' | 'time'>,
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

    this.logger.log('Evento publicado en Kafka', {
      topic,
      type: fullEvent.type,
      id: fullEvent.id,
    });
  }
}
