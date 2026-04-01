import { Controller, Get } from '@nestjs/common';
import { CardIssuerService } from './card-issuer.service';

@Controller()
export class CardIssuerController {
  constructor(private readonly cardIssuerService: CardIssuerService) {}

  @Get()
  getHello(): string {
    return this.cardIssuerService.getHello();
  }
}
