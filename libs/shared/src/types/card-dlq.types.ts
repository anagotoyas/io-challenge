import { CardRequestedData } from './card-requested.types';

export interface CardDLQData {
  requestId: string;
  reason: string;
  attempts: number;
  originalPayload: CardRequestedData;
}
