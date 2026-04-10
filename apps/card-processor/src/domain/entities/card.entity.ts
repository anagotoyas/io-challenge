import { randomUUID } from 'crypto';
import { CardNumber } from '../value-objects/card-number.vo';
import { Cvv } from '../value-objects/cvv.vo';
import { ExpiresAt } from '../value-objects/expires-at.vo';

export class Card {
  readonly cardId: string;
  readonly requestId: string;
  readonly cardNumber: CardNumber;
  readonly cvv: Cvv;
  readonly expiresAt: ExpiresAt;

  private constructor(props: {
    cardId: string;
    requestId: string;
    cardNumber: CardNumber;
    cvv: Cvv;
    expiresAt: ExpiresAt;
  }) {
    this.cardId = props.cardId;
    this.requestId = props.requestId;
    this.cardNumber = props.cardNumber;
    this.cvv = props.cvv;
    this.expiresAt = props.expiresAt;
  }

  static create(requestId: string): Card {
    return new Card({
      cardId: randomUUID(),
      requestId,
      cardNumber: CardNumber.generate(),
      cvv: Cvv.generate(),
      expiresAt: ExpiresAt.generate(),
    });
  }

  toPrimitives(): {
    cardId: string;
    requestId: string;
    cardNumber: string;
    cvv: string;
    expiresAt: string;
  } {
    return {
      cardId: this.cardId,
      requestId: this.requestId,
      cardNumber: this.cardNumber.value,
      cvv: this.cvv.value,
      expiresAt: this.expiresAt.value,
    };
  }
}
