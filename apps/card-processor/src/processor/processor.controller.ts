import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CloudEvent, CardRequestedData, TOPICS } from '@app/shared';
import { ProcessorService } from './processor.service';

@Controller()
export class ProcessorController {
  private readonly logger = new Logger(ProcessorController.name);

  constructor(private readonly processorService: ProcessorService) {}

  @EventPattern(TOPICS.CARD_REQUESTED)
  async handleCardRequested(@Payload() message: unknown) {
    try {
      const event = this.parseMessage<CardRequestedData>(message);

      this.logger.log('Evento recibido', {
        id: event.id,
        type: event.type,
        requestId: event.data.requestId,
        source: event.source,
      });

      await this.processorService.process(event.data, event.source);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Error inesperado en consumer', {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  private parseMessage<T>(message: unknown): CloudEvent<T> {
    if (Buffer.isBuffer(message)) {
      return JSON.parse(message.toString()) as CloudEvent<T>;
    }

    if (typeof message === 'object' && message !== null && 'value' in message) {
      const raw = (message as { value: unknown }).value;
      if (Buffer.isBuffer(raw)) {
        return JSON.parse(raw.toString()) as CloudEvent<T>;
      }
      if (typeof raw === 'string') {
        return JSON.parse(raw) as CloudEvent<T>;
      }
      return raw as CloudEvent<T>;
    }

    if (typeof message === 'string') {
      return JSON.parse(message) as CloudEvent<T>;
    }

    return message as CloudEvent<T>;
  }
}
