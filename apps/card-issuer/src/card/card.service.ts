import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
    const requestId = randomUUID();

    try {
      await this.cardRepository.create(requestId, dto);
    } catch (error) {
      if (this.cardRepository.isUniqueConstraintError(error)) {
        this.logger.warn(
          { documentNumber: `****${documentNumber.slice(-4)}` },
          'Solicitud rechazada: cliente ya tiene tarjeta',
        );
        throw new ConflictException(
          'El cliente ya tiene una tarjeta en proceso o emitida',
        );
      }
      throw error;
    }

    const eventData = CardRequestedEvent.from(requestId, dto);

    try {
      await this.kafkaProducer.publish<CardRequestedData>(TOPICS.CARD_REQUESTED, {
        source: requestId,
        type: TOPICS.CARD_REQUESTED,
        data: eventData,
      });
    } catch (error) {
      await this.cardRepository.delete(requestId);
      this.logger.error(
        { requestId, reason: error instanceof Error ? error.message : String(error) },
        'Fallo al publicar evento en Kafka, solicitud revertida',
      );
      throw new InternalServerErrorException(
        'Error al procesar la solicitud, intente nuevamente',
      );
    }

    this.logger.log(
      {
        requestId,
        documentNumber: `****${documentNumber.slice(-4)}`,
        currency: dto.product.currency,
      },
      'Solicitud de tarjeta registrada',
    );

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
          cardNumber: `**** **** **** ${record.issuedCard.cardNumber.slice(-4)}`,
          expiresAt: record.issuedCard.expiresAt,
        },
      };
    }

    return { requestId, status: record.status };
  }
}
