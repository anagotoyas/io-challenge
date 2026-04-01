import { Test, TestingModule } from '@nestjs/testing';
import { CardIssuerController } from './card-issuer.controller';
import { CardIssuerService } from './card-issuer.service';

describe('CardIssuerController', () => {
  let cardIssuerController: CardIssuerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CardIssuerController],
      providers: [CardIssuerService],
    }).compile();

    cardIssuerController = app.get<CardIssuerController>(CardIssuerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(cardIssuerController.getHello()).toBe('Hello World!');
    });
  });
});
