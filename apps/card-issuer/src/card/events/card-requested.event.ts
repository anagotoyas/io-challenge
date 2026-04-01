import { CardRequestedData } from '@app/shared';
import { IssueCardDto } from '../dto/issue-card.dto';

export class CardRequestedEvent {
  static from(requestId: string, dto: IssueCardDto): CardRequestedData {
    return {
      requestId,
      customer: {
        documentType: dto.customer.documentType,
        documentNumber: dto.customer.documentNumber,
        fullName: dto.customer.fullName,
        age: dto.customer.age,
        email: dto.customer.email,
      },
      product: {
        type: dto.product.type,
        currency: dto.product.currency,
      },
      forceError: dto.forceError ?? false,
    };
  }
}
