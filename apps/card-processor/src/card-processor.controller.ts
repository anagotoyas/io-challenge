import { Controller, Get } from '@nestjs/common';
import { CardProcessorService } from './card-processor.service';

@Controller()
export class CardProcessorController {
  constructor(private readonly cardProcessorService: CardProcessorService) {}

  @Get()
  getHello(): string {
    return this.cardProcessorService.getHello();
  }
}
