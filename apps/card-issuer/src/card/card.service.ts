import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CardRepository } from './card.repository';
import { IssueCardDto } from './dto/issue-card.dto';
import { CardRequestedEvent } from './events/card-requested.event';
import { IssueCardResponse } from './responses/issue-card.response';
import { CardStatusResponse } from './responses/card-status.response';

import { CardRequestedData, KafkaProducer, TOPICS } from '@app/shared';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private readonly cardRepository: CardRepository,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async issueCard(dto: IssueCardDto): Promise<IssueCardResponse> {
    const { documentNumber } = dto.customer;

    const exists =
      await this.cardRepository.existsByDocumentNumber(documentNumber);

    if (exists) {
      this.logger.warn('Solicitud rechazada: cliente ya tiene tarjeta', {
        documentNumber: `****${documentNumber.slice(-4)}`,
      });
      throw new ConflictException(
        'El cliente ya tiene una tarjeta en proceso o emitida',
      );
    }

    const requestId = randomUUID();
    const eventData = CardRequestedEvent.from(requestId, dto);

    await this.cardRepository.create(requestId, dto);

    await this.kafkaProducer.publish<CardRequestedData>(TOPICS.CARD_REQUESTED, {
      source: requestId,
      type: TOPICS.CARD_REQUESTED,
      data: eventData,
    });

    this.logger.log('Solicitud de tarjeta registrada', {
      requestId,
      documentNumber: `****${documentNumber.slice(-4)}`,
      currency: dto.product.currency,
    });

    return { requestId, status: 'pending' };
  }

  async getStatus(requestId: string): Promise<CardStatusResponse> {
    const record = await this.cardRepository.findByRequestId(requestId);

    if (!record) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (record.status === 'issued' && record.issuedCard) {
      return {
        requestId,
        status: record.status,
        card: {
          cardNumber: record.issuedCard.cardNumber,
          expiresAt: record.issuedCard.expiresAt,
        },
      };
    }

    return { requestId, status: record.status };
  }
}
