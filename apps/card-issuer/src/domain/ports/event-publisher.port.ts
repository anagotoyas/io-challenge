import { CardRequestedData } from '@app/shared';

export interface EventPublisherPort {
  publishCardRequested(data: CardRequestedData, source: string): Promise<void>;
}
