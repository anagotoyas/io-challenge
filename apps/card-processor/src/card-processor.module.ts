import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  SharedModule,
  KafkaModule,
  LoggerModule,
  LoggerPort,
  LOGGER_PORT,
} from '@app/shared';

import { IssueCardUseCase } from './application/use-cases/issue-card.use-case';

import { PrismaCardRepository } from './infrastructure/persistence/prisma-card.repository';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event-publisher';
import { ExternalCardIssuerAdapter } from './infrastructure/messaging/external-card-issuer.adapter';
import { CardProcessorController } from './infrastructure/kafka/card-processor.controller';
import {
  CARD_REPOSITORY_PORT,
  EVENT_PUBLISHER_PORT,
  CARD_ISSUER_PORT,
} from './infrastructure/injection-tokens';

import { CardRepositoryPort } from './domain/ports/card.repository.port';
import { EventPublisherPort } from './domain/ports/event-publisher.port';
import { CardIssuerPort } from './domain/ports/card-issuer.port';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    SharedModule,
    KafkaModule.forRoot('card-processor'),
  ],
  controllers: [CardProcessorController],
  providers: [
    PrismaCardRepository,
    KafkaEventPublisher,
    ExternalCardIssuerAdapter,

    { provide: CARD_REPOSITORY_PORT, useExisting: PrismaCardRepository },
    { provide: EVENT_PUBLISHER_PORT, useExisting: KafkaEventPublisher },
    { provide: CARD_ISSUER_PORT, useExisting: ExternalCardIssuerAdapter },

    {
      provide: IssueCardUseCase,
      useFactory: (
        repo: CardRepositoryPort,
        pub: EventPublisherPort,
        issuer: CardIssuerPort,
        logger: LoggerPort,
      ) => new IssueCardUseCase(repo, pub, issuer, logger),
      inject: [
        CARD_REPOSITORY_PORT,
        EVENT_PUBLISHER_PORT,
        CARD_ISSUER_PORT,
        LOGGER_PORT,
      ],
    },
  ],
})
export class CardProcessorModule {}
