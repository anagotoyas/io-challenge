import { Injectable } from '@nestjs/common';

@Injectable()
export class CardIssuerService {
  getHello(): string {
    return 'Hello World!';
  }
}
