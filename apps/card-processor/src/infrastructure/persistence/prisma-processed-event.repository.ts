import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/shared';
import { ProcessedEventRepositoryPort } from '../../domain/ports/processed-event.repository.port';

@Injectable()
export class PrismaProcessedEventRepository implements ProcessedEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(eventId: string): Promise<boolean> {
    return (
      (await this.prisma.processedEvent.findUnique({ where: { eventId } })) !==
      null
    );
  }

  async saveWithTransaction(
    eventId: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Marca el evento como procesado primero dentro de la transacción.
      // Si fn() lanza, el INSERT se revierte y el evento queda sin marcar
      // → el próximo reintento lo procesará normalmente.
      await tx.processedEvent.create({ data: { eventId } });
      await fn();
    });
  }
}
