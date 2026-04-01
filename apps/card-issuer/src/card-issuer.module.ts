import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardModule } from './card/card.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CardModule, KafkaModule],
})
export class CardIssuerModule {}
