import { Module } from '@nestjs/common';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { CardRepository } from './card.repository';
import { KafkaModule, SharedModule } from '@app/shared';

@Module({
  imports: [SharedModule, KafkaModule.forRoot('card-issuer')],
  controllers: [CardController],
  providers: [CardService, CardRepository],
})
export class CardModule {}
