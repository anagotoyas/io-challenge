import { CustomerData } from './card-requested.types';

export interface CardIssuedData {
  requestId: string;
  customer: CustomerData;
  card: {
    cardId: string;
    cardNumber: string;
    expiresAt: string;
    cvv: string;
  };
}
