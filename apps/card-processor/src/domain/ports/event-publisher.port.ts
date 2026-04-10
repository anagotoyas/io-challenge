import { CardIssuedData, CardDLQData } from '@app/shared';

export interface EventPublisherPort {
  publishCardIssued(data: CardIssuedData, source: string): Promise<void>;
  publishCardDlq(data: CardDLQData, source: string): Promise<void>;
}
