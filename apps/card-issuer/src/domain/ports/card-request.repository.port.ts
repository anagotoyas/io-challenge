import { CustomerData, ProductData } from '@app/shared';

export type CardStatus = 'pending' | 'issued' | 'failed';

export interface IssuedCardDetail {
  cardNumber: string;
  expiresAt: string;
}

export interface CardRequestRecord {
  requestId: string;
  status: CardStatus;
  issuedCard: IssuedCardDetail | null;
}

export interface CreateCardRequestData {
  requestId: string;
  customer: CustomerData;
  product: ProductData;
}

export interface CardRequestRepositoryPort {
  create(data: CreateCardRequestData): Promise<void>;
  delete(requestId: string): Promise<void>;
  findByRequestId(requestId: string): Promise<CardRequestRecord | null>;
  isUniqueConstraintError(error: unknown): boolean;
}
