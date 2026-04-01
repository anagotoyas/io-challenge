import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardModule } from './card/card.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CardModule],
})
export class CardIssuerModule {}
