import {
  RequestCardUseCase,
  RequestCardInput,
  DuplicateCardRequestError,
  EventPublishError,
} from './request-card.use-case';
import { CardRequestRepositoryPort } from '../../domain/ports/card-request.repository.port';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { LoggerPort } from '@app/shared';

const mockInput: RequestCardInput = {
  customer: {
    documentType: 'DNI',
    documentNumber: '12345678',
    fullName: 'Test User',
    age: 30,
    email: 'test@test.com',
  },
  product: { type: 'VISA', currency: 'PEN' },
  forceError: false,
};

describe('RequestCardUseCase', () => {
  let useCase: RequestCardUseCase;
  let cardRequestRepository: jest.Mocked<CardRequestRepositoryPort>;
  let eventPublisher: jest.Mocked<EventPublisherPort>;
  let logger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    cardRequestRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      findByRequestId: jest.fn(),
      isUniqueConstraintError: jest.fn().mockReturnValue(false),
    };
    eventPublisher = {
      publishCardRequested: jest.fn().mockResolvedValue(undefined),
    };
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    useCase = new RequestCardUseCase(
      cardRequestRepository,
      eventPublisher,
      logger,
    );
  });

  it('devuelve requestId y status pending', async () => {
    const result = await useCase.execute(mockInput);

    expect(result.status).toBe('pending');
    expect(result.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('lanza DuplicateCardRequestError si el documentNumber ya existe', async () => {
    cardRequestRepository.create.mockRejectedValue(new Error('unique'));
    cardRequestRepository.isUniqueConstraintError.mockReturnValue(true);

    await expect(useCase.execute(mockInput)).rejects.toThrow(
      DuplicateCardRequestError,
    );
    expect(eventPublisher.publishCardRequested).not.toHaveBeenCalled();
  });

  it('hace rollback y lanza EventPublishError si Kafka falla', async () => {
    eventPublisher.publishCardRequested.mockRejectedValue(
      new Error('kafka down'),
    );

    await expect(useCase.execute(mockInput)).rejects.toThrow(EventPublishError);
    expect(cardRequestRepository.delete).toHaveBeenCalled();
  });
});
