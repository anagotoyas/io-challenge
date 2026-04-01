import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { CardRepository } from './card.repository';
import { SharedModule } from '@app/shared';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [SharedModule, KafkaModule],
  controllers: [CardController],
  providers: [CardService, CardRepository],
})
export class CardModule {}
