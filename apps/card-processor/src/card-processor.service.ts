import { Injectable } from '@nestjs/common';

@Injectable()
export class CardProcessorService {
  getHello(): string {
    return 'Hello World!';
  }
}
