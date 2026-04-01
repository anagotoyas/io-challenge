import { Test, TestingModule } from '@nestjs/testing';
import { CardProcessorController } from './card-processor.controller';
import { CardProcessorService } from './card-processor.service';

describe('CardProcessorController', () => {
  let cardProcessorController: CardProcessorController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CardProcessorController],
      providers: [CardProcessorService],
    }).compile();

    cardProcessorController = app.get<CardProcessorController>(CardProcessorController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(cardProcessorController.getHello()).toBe('Hello World!');
    });
  });
});
