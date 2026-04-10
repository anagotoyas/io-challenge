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
  documentType: string;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
  cardType: string;
  currency: string;
}

export interface CardRequestRepositoryPort {
  create(data: CreateCardRequestData): Promise<void>;
  delete(requestId: string): Promise<void>;
  findByRequestId(requestId: string): Promise<CardRequestRecord | null>;
  isUniqueConstraintError(error: unknown): boolean;
}
