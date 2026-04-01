import { Injectable, Logger } from '@nestjs/common';
import {
  CardRequestedData,
  CardIssuedData,
  CardDLQData,
  TOPICS,
} from '@app/shared';
import { simulateExternalCall } from './utils/external-service.simulator';
import { generateCardData } from './utils/card-generator';
import { ProcessorRepository } from './processor.repository';
import { KafkaProducer } from '@app/shared';

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS = [1000, 2000, 4000];

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private readonly repository: ProcessorRepository,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async process(data: CardRequestedData, source: string): Promise<void> {
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        this.logger.log(
          { requestId: data.requestId, attempt, maxAttempts: MAX_ATTEMPTS },
          'Iniciando procesamiento',
        );

        await simulateExternalCall(data.forceError);

        const card = generateCardData();

        await this.repository.saveIssuedCard({
          ...card,
          requestId: data.requestId,
        });
        await this.repository.updateStatus(data.requestId, 'issued');

        await this.kafkaProducer.publish<CardIssuedData>(TOPICS.CARD_ISSUED, {
          source,
          type: TOPICS.CARD_ISSUED,
          data: {
            requestId: data.requestId,
            customer: data.customer,
            card: {
              cardId: card.cardId,
              cardNumber: card.cardNumber,
              expiresAt: card.expiresAt,
              cvv: card.cvv,
            },
          },
        });

        this.logger.log(
          {
            requestId: data.requestId,
            cardNumber: `**** **** **** ${card.cardNumber.slice(-4)}`,
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
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    await this.repository.updateStatus(data.requestId, 'failed');

    const dlqData: CardDLQData = {
      requestId: data.requestId,
      error: {
        message: lastError,
        attempts: MAX_ATTEMPTS,
      },
      originalPayload: data,
    };

    await this.kafkaProducer.publish<CardDLQData>(TOPICS.CARD_DLQ, {
      source,
      type: TOPICS.CARD_DLQ,
      data: dlqData,
    });

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
