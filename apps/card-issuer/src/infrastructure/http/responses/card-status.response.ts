interface IssuedCardDetail {
  cardNumber: string;
  expiresAt: string;
}

export interface CardStatusResponse {
  requestId: string;
  status: string;
  card?: IssuedCardDetail;
}
