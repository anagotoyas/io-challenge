import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/shared';
import {
  CardRepositoryPort,
  IssuedCardPrimitives,
} from '../../domain/ports/card.repository.port';

@Injectable()
export class PrismaCardRepository implements CardRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async saveIssuedCard(card: IssuedCardPrimitives): Promise<void> {
    await this.prisma.issuedCard.create({ data: card });
  }

  async updateStatus(
    requestId: string,
    status: 'issued' | 'failed',
  ): Promise<void> {
    await this.prisma.cardRequest.update({
      where: { requestId },
      data: { status },
    });
  }
}
