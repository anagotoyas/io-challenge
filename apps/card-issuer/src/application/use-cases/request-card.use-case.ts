import { CardRequestedData } from '@app/shared';
import { CardRequest } from '../../domain/entities/card-request.entity';
import { CardRequestRepositoryPort } from '../../domain/ports/card-request.repository.port';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { LoggerPort } from '../../domain/ports/logger.port';

export interface RequestCardInput {
  documentType: string;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
  cardType: string;
  currency: string;
  forceError: boolean;
}

export interface RequestCardOutput {
  requestId: string;
  status: 'pending';
}

export class RequestCardUseCase {
  constructor(
    private readonly cardRequestRepository: CardRequestRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(input: RequestCardInput): Promise<RequestCardOutput> {
    const cardRequest = CardRequest.create();
    const requestId = cardRequest.requestId.value;

    try {
      await this.cardRequestRepository.create({
        requestId,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        fullName: input.fullName,
        age: input.age,
        email: input.email,
        cardType: input.cardType,
        currency: input.currency,
      });
    } catch (error) {
      if (this.cardRequestRepository.isUniqueConstraintError(error)) {
        this.logger.warn(
          { documentNumber: `****${input.documentNumber.slice(-4)}` },
          'Solicitud rechazada: cliente ya tiene tarjeta',
        );
        throw new DuplicateCardRequestError(
          'El cliente ya tiene una tarjeta en proceso o emitida',
        );
      }
      throw error;
    }

    const eventData: CardRequestedData = {
      requestId,
      customer: {
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        fullName: input.fullName,
        age: input.age,
        email: input.email,
      },
      product: {
        type: input.cardType,
        currency: input.currency,
      },
      forceError: input.forceError,
    };

    try {
      await this.eventPublisher.publishCardRequested(eventData, requestId);
    } catch (error) {
      await this.cardRequestRepository.delete(requestId);
      this.logger.error(
        {
          requestId,
          reason: error instanceof Error ? error.message : String(error),
        },
        'Fallo al publicar evento en Kafka, solicitud revertida',
      );
      throw new EventPublishError(
        'Error al procesar la solicitud, intente nuevamente',
      );
    }

    this.logger.log(
      {
        requestId,
        documentNumber: `****${input.documentNumber.slice(-4)}`,
        currency: input.currency,
      },
      'Solicitud de tarjeta registrada',
    );

    return { requestId, status: 'pending' };
  }
}

export class DuplicateCardRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateCardRequestError';
  }
}

export class EventPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventPublishError';
  }
}
