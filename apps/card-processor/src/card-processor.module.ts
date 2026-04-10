import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule, KafkaModule, LoggerModule } from '@app/shared';

import { IssueCardUseCase } from './application/use-cases/issue-card.use-case';

import { PrismaCardRepository } from './infrastructure/persistence/prisma-card.repository';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event-publisher';
import { ExternalCardIssuerAdapter } from './infrastructure/messaging/external-card-issuer.adapter';
import { NestJsLoggerAdapter } from './infrastructure/logger/nestjs-logger.adapter';
import { CardProcessorController } from './infrastructure/kafka/card-processor.controller';
import {
  CARD_REPOSITORY_PORT,
  EVENT_PUBLISHER_PORT,
  CARD_ISSUER_PORT,
  LOGGER_PORT,
} from './infrastructure/injection-tokens';

import { CardRepositoryPort } from './domain/ports/card.repository.port';
import { EventPublisherPort } from './domain/ports/event-publisher.port';
import { CardIssuerPort } from './domain/ports/card-issuer.port';
import { LoggerPort } from './domain/ports/logger.port';

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
    NestJsLoggerAdapter,

    { provide: CARD_REPOSITORY_PORT, useExisting: PrismaCardRepository },
    { provide: EVENT_PUBLISHER_PORT, useExisting: KafkaEventPublisher },
    { provide: CARD_ISSUER_PORT, useExisting: ExternalCardIssuerAdapter },
    { provide: LOGGER_PORT, useExisting: NestJsLoggerAdapter },

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
