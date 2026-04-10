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

    this.producer = kafka.producer({
      // Evita duplicados cuando el producer reintenta por timeout de red:
      // el broker reconoce mensajes ya recibidos usando el sequence number
      // y los descarta sin procesarlos dos veces.
      idempotent: true,

      // Requerido por idempotent=true: solo una request en vuelo a la vez
      // por broker, garantizando el orden de los sequence numbers.
      maxInFlightRequests: 1,
    });
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
    event: Omit<CloudEvent<T>, 'id' | 'time'> & { type: EventType; key?: string },
  ): Promise<void> {
    const fullEvent: CloudEvent<T> = {
      ...event,
      id: ++this.eventCounter,
      time: new Date().toISOString(),
    };

    await this.producer.send({
      topic,
      messages: [
        {
          // Misma solicitud siempre va a la misma partición: garantiza orden
          // de eventos (CARD_REQUESTED → CARD_ISSUED) para un mismo requestId.
          key: event.key ?? null,
          value: JSON.stringify(fullEvent),
        },
      ],
      // El mensaje se confirma solo cuando el leader y todos los ISR
      // (in-sync replicas) lo han escrito. Evita pérdida de mensajes
      // si el leader falla justo después de confirmar.
      acks: -1,
    });

    this.logger.log(
      {
        topic,
        type: fullEvent.type,
        id: fullEvent.id,
        source: fullEvent.source,
        key: event.key,
      },
      'Evento publicado',
    );
  }
}
