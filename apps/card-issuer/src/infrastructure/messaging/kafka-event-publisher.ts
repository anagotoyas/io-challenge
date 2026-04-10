import { Injectable } from '@nestjs/common';
import { KafkaProducer, CardRequestedData, TOPICS } from '@app/shared';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';

@Injectable()
export class KafkaEventPublisher implements EventPublisherPort {
  constructor(private readonly kafkaProducer: KafkaProducer) {}

  async publishCardRequested(
    data: CardRequestedData,
    source: string,
  ): Promise<void> {
    await this.kafkaProducer.publish<CardRequestedData>(TOPICS.CARD_REQUESTED, {
      source,
      type: TOPICS.CARD_REQUESTED,
      data,
    });
  }
}
