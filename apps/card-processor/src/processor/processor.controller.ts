import { CardRequestedData, CloudEvent, TOPICS } from '@app/shared';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class ProcessorController {
  private readonly logger = new Logger(ProcessorController.name);

  @EventPattern(TOPICS.CARD_REQUESTED)
  handleCardRequested(
    @Payload()
    message:
      | CloudEvent<CardRequestedData>
      | { value: CloudEvent<CardRequestedData> },
  ) {
    const event: CloudEvent<CardRequestedData> =
      'value' in message ? message.value : message;

    this.logger.log('Evento recibido', {
      id: event.id,
      type: event.type,
      requestId: event.data.requestId,
      source: event.source,
    });
  }
}
