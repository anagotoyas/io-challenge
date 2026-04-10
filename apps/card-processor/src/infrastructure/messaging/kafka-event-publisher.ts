import { Injectable } from '@nestjs/common';
import {
  KafkaProducer,
  CardIssuedData,
  CardDLQData,
  TOPICS,
} from '@app/shared';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisherPort {
  constructor(private readonly kafkaProducer: KafkaProducer) {}

  async publishCardIssued(data: CardIssuedData, source: string): Promise<void> {
    await this.kafkaProducer.publish<CardIssuedData>(TOPICS.CARD_ISSUED, {
      source,
      type: TOPICS.CARD_ISSUED,
      data,
    });
  }

  async publishCardDlq(data: CardDLQData, source: string): Promise<void> {
    await this.kafkaProducer.publish<CardDLQData>(TOPICS.CARD_DLQ, {
      source,
      type: TOPICS.CARD_DLQ,
      data,
    });
  }
}
