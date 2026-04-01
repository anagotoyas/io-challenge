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

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private readonly repository: ProcessorRepository,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async process(data: CardRequestedData, source: string): Promise<void> {
    let attempt = 0;

    while (attempt <= MAX_RETRIES) {
      try {
        this.logger.log(
          {
            requestId: data.requestId,
            attempt: attempt + 1,
            maxAttempts: MAX_RETRIES + 1,
          },
          'Iniciando procesamiento',
        );

        await simulateExternalCall(data.forceError);

        const card = generateCardData();

        await this.repository.saveIssuedCard({
          ...card,
          requestId: data.requestId,
        });

        await this.repository.updateStatus(data.requestId, 'issued');

        const issuedData: CardIssuedData = {
          requestId: data.requestId,
          customer: data.customer,
          card: {
            cardId: card.cardId,
            cardNumber: card.cardNumber,
            expiresAt: card.expiresAt,
            cvv: card.cvv,
          },
        };

        await this.kafkaProducer.publish<CardIssuedData>(TOPICS.CARD_ISSUED, {
          source,
          type: TOPICS.CARD_ISSUED,
          data: issuedData,
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
        attempt++;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (attempt <= MAX_RETRIES) {
          const delay = RETRY_DELAYS[attempt - 1];

          this.logger.warn(
            {
              requestId: data.requestId,
              attempt,
              maxRetries: MAX_RETRIES,
              nextRetryMs: delay,
              reason: errorMessage,
            },
            'Fallo en procesamiento, reintentando',
          );

          await new Promise((r) => setTimeout(r, delay));
        } else {
          await this.repository.updateStatus(data.requestId, 'failed');

          const dlqData: CardDLQData = {
            requestId: data.requestId,
            error: {
              message: errorMessage,
              attempts: attempt,
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
              totalAttempts: attempt,
              reason: errorMessage,
            },
            'Reintentos agotados, enviado a DLQ',
          );
        }
      }
    }
  }
}
