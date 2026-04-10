import { CardRequestedData, CardIssuedData, CardDLQData } from '@app/shared';
import { Card } from '../../domain/entities/card.entity';
import { CardRepositoryPort } from '../../domain/ports/card.repository.port';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { CardIssuerPort } from '../../domain/ports/card-issuer.port';
import { LoggerPort } from '../../domain/ports/logger.port';

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS = [1000, 2000, 4000] as const;

export class IssueCardUseCase {
  constructor(
    private readonly cardRepository: CardRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
    private readonly cardIssuer: CardIssuerPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(data: CardRequestedData, source: string): Promise<void> {
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        this.logger.log(
          { requestId: data.requestId, attempt, maxAttempts: MAX_ATTEMPTS },
          'Iniciando procesamiento',
        );

        await this.cardIssuer.issue(data.forceError);

        const card = Card.create(data.requestId);
        const primitives = card.toPrimitives();

        await this.cardRepository.saveIssuedCard(primitives);
        await this.cardRepository.updateStatus(data.requestId, 'issued');

        const issuedData: CardIssuedData = {
          requestId: data.requestId,
          customer: data.customer,
          card: {
            cardId: primitives.cardId,
            cardNumber: primitives.cardNumber,
            expiresAt: primitives.expiresAt,
            cvv: primitives.cvv,
          },
        };

        await this.eventPublisher.publishCardIssued(issuedData, source);

        this.logger.log(
          {
            requestId: data.requestId,
            cardNumber: card.cardNumber.masked(),
          },
          'Tarjeta emitida exitosamente',
        );

        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt < MAX_ATTEMPTS) {
          const delay = RETRY_DELAYS[attempt - 1];
          this.logger.warn(
            {
              requestId: data.requestId,
              attempt,
              remainingAttempts: MAX_ATTEMPTS - attempt,
              nextRetryMs: delay,
              reason: lastError,
            },
            'Fallo en procesamiento, reintentando',
          );
          await new Promise<void>((r) => setTimeout(r, delay));
        }
      }
    }

    await this.cardRepository.updateStatus(data.requestId, 'failed');

    const dlqData: CardDLQData = {
      requestId: data.requestId,
      error: { message: lastError, attempts: MAX_ATTEMPTS },
      originalPayload: data,
    };

    await this.eventPublisher.publishCardDlq(dlqData, source);

    this.logger.error(
      {
        requestId: data.requestId,
        totalAttempts: MAX_ATTEMPTS,
        reason: lastError,
      },
      'Reintentos agotados, enviado a DLQ',
    );
  }
}
