import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/shared';
import { IssueCardDto } from './dto/issue-card.dto';

@Injectable()
export class CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByDocumentNumber(documentNumber: string): Promise<boolean> {
    const record = await this.prisma.cardRequest.findUnique({
      where: { documentNumber },
    });
    return !!record;
  }

  async create(requestId: string, dto: IssueCardDto) {
    return this.prisma.cardRequest.create({
      data: {
        requestId,
        documentType: dto.customer.documentType,
        documentNumber: dto.customer.documentNumber,
        fullName: dto.customer.fullName,
        age: dto.customer.age,
        email: dto.customer.email,
        cardType: dto.product.type,
        currency: dto.product.currency,
        status: 'pending',
      },
    });
  }

  async findByRequestId(requestId: string) {
    return this.prisma.cardRequest.findUnique({
      where: { requestId },
      include: { issuedCard: true },
    });
  }
}
