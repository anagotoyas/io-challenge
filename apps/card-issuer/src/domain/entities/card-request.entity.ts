import { RequestId } from '../value-objects/request-id.vo';

export type CardRequestStatus = 'pending' | 'issued' | 'failed';

export class CardRequest {
  readonly requestId: RequestId;
  readonly status: CardRequestStatus;

  private constructor(props: {
    requestId: RequestId;
    status: CardRequestStatus;
  }) {
    this.requestId = props.requestId;
    this.status = props.status;
  }

  static create(): CardRequest {
    return new CardRequest({
      requestId: RequestId.generate(),
      status: 'pending',
    });
  }
}
