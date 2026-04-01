import { Module } from '@nestjs/common';
import { CardIssuerController } from './card-issuer.controller';
import { CardIssuerService } from './card-issuer.service';

@Module({
  imports: [],
  controllers: [CardIssuerController],
  providers: [CardIssuerService],
})
export class CardIssuerModule {}
