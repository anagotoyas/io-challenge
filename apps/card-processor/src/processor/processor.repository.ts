import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/shared';

@Injectable()
export class ProcessorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateStatus(requestId: string, status: 'issued' | 'failed') {
    return this.prisma.cardRequest.update({
      where: { requestId },
      data: { status },
    });
  }

  async saveIssuedCard(data: {
    cardId: string;
    requestId: string;
    cardNumber: string;
    expiresAt: string;
    cvv: string;
  }) {
    return this.prisma.issuedCard.create({ data });
  }
}
