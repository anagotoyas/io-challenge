export interface IssuedCardPrimitives {
  cardId: string;
  requestId: string;
  cardNumber: string;
  expiresAt: string;
  cvv: string;
}

export interface CardRepositoryPort {
  saveIssuedCard(card: IssuedCardPrimitives): Promise<void>;
  updateStatus(requestId: string, status: 'issued' | 'failed'): Promise<void>;
}
