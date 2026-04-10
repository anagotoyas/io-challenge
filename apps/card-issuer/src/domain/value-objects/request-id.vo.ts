import { randomUUID } from 'crypto';

export class RequestId {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static generate(): RequestId {
    return new RequestId(randomUUID());
  }
}
