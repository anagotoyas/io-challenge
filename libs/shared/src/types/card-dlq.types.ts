import { CardRequestedData } from './card-requested.types';

export interface CardDLQError {
  message: string;
  attempts: number;
}

export interface CardDLQData {
  requestId: string;
  error: CardDLQError;
  originalPayload: CardRequestedData;
}
