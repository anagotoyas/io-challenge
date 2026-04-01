import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '@app/shared';
import { IssueCardDto } from './dto/issue-card.dto';

@Injectable()
export class CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
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
      },
    });
  }

  async delete(requestId: string) {
    return this.prisma.cardRequest.delete({ where: { requestId } });
  }

  async findByRequestId(requestId: string) {
    return this.prisma.cardRequest.findUnique({
      where: { requestId },
      include: { issuedCard: true },
    });
  }
}
