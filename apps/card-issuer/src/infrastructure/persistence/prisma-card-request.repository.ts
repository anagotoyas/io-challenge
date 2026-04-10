import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '@app/shared';
import {
  CardRequestRepositoryPort,
  CardRequestRecord,
  CreateCardRequestData,
} from '../../domain/ports/card-request.repository.port';

@Injectable()
export class PrismaCardRequestRepository implements CardRequestRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  async create(data: CreateCardRequestData): Promise<void> {
    await this.prisma.cardRequest.create({ data });
  }

  async delete(requestId: string): Promise<void> {
    await this.prisma.cardRequest.delete({ where: { requestId } });
  }

  async findByRequestId(requestId: string): Promise<CardRequestRecord | null> {
    const record = await this.prisma.cardRequest.findUnique({
      where: { requestId },
      include: { issuedCard: true },
    });

    if (!record) return null;

    return {
      requestId: record.requestId,
      status: record.status as CardRequestRecord['status'],
      issuedCard: record.issuedCard
        ? {
            cardNumber: record.issuedCard.cardNumber,
            expiresAt: record.issuedCard.expiresAt,
          }
        : null,
    };
  }
}
