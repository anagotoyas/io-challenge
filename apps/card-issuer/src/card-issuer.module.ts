import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule, KafkaModule, LoggerModule, LoggerPort, LOGGER_PORT } from '@app/shared';

import { RequestCardUseCase } from './application/use-cases/request-card.use-case';

import { PrismaCardRequestRepository } from './infrastructure/persistence/prisma-card-request.repository';
import { KafkaEventPublisher } from './infrastructure/messaging/kafka-event-publisher';
import { CardController } from './infrastructure/http/card.controller';
import {
  CARD_REQUEST_REPOSITORY_PORT,
  EVENT_PUBLISHER_PORT,
} from './infrastructure/injection-tokens';

import { CardRequestRepositoryPort } from './domain/ports/card-request.repository.port';
import { EventPublisherPort } from './domain/ports/event-publisher.port';

import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    SharedModule,
    KafkaModule.forRoot('card-issuer'),
  ],
  controllers: [CardController, HealthController],
  providers: [
    PrismaCardRequestRepository,
    KafkaEventPublisher,

    {
      provide: CARD_REQUEST_REPOSITORY_PORT,
      useExisting: PrismaCardRequestRepository,
    },
    { provide: EVENT_PUBLISHER_PORT, useExisting: KafkaEventPublisher },

    {
      provide: RequestCardUseCase,
      useFactory: (
        repo: CardRequestRepositoryPort,
        pub: EventPublisherPort,
        logger: LoggerPort,
      ) => new RequestCardUseCase(repo, pub, logger),
      inject: [CARD_REQUEST_REPOSITORY_PORT, EVENT_PUBLISHER_PORT, LOGGER_PORT],
    },
  ],
})
export class CardIssuerModule {}
