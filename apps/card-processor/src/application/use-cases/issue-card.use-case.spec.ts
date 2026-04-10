import { IssueCardUseCase } from './issue-card.use-case';
import { CardRepositoryPort } from '../../domain/ports/card.repository.port';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';
import { CardIssuerPort } from '../../domain/ports/card-issuer.port';
import { ProcessedEventRepositoryPort } from '../../domain/ports/processed-event.repository.port';
import { LoggerPort, CardRequestedData } from '@app/shared';

const mockData: CardRequestedData = {
  requestId: 'req-123',
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

describe('IssueCardUseCase', () => {
  let useCase: IssueCardUseCase;
  let cardRepository: jest.Mocked<CardRepositoryPort>;
  let eventPublisher: jest.Mocked<EventPublisherPort>;
  let cardIssuer: jest.Mocked<CardIssuerPort>;
  let processedEventRepo: jest.Mocked<ProcessedEventRepositoryPort>;
  let logger: jest.Mocked<LoggerPort>;

  beforeEach(() => {
    jest.useFakeTimers();

    cardRepository = {
      saveIssuedCard: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    eventPublisher = {
      publishCardIssued: jest.fn().mockResolvedValue(undefined),
      publishCardDlq: jest.fn().mockResolvedValue(undefined),
    };
    cardIssuer = { issue: jest.fn().mockResolvedValue(undefined) };
    processedEventRepo = {
      exists: jest.fn().mockResolvedValue(false),
      saveWithTransaction: jest
        .fn()
        .mockImplementation(async (_id: string, fn: () => Promise<void>) =>
          fn(),
        ),
    };
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    useCase = new IssueCardUseCase(
      cardRepository,
      eventPublisher,
      cardIssuer,
      logger,
      processedEventRepo,
    );
  });

  afterEach(() => jest.useRealTimers());

  it('ignora el evento si ya fue procesado', async () => {
    processedEventRepo.exists.mockResolvedValue(true);

    await useCase.execute('evt-1', mockData, 'source');

    expect(cardIssuer.issue).not.toHaveBeenCalled();
  });

  it('emite la tarjeta y actualiza status a issued en el happy path', async () => {
    await useCase.execute('evt-1', mockData, 'source');

    expect(cardRepository.updateStatus).toHaveBeenCalledWith(
      mockData.requestId,
      'issued',
    );
    expect(eventPublisher.publishCardIssued).toHaveBeenCalled();
  });

  it('agota 4 intentos y envía a DLQ con el error correcto', async () => {
    cardIssuer.issue.mockRejectedValue(new Error('servicio caído'));

    const execution = useCase.execute('evt-1', mockData, 'source');
    await jest.runAllTimersAsync();
    await execution;

    expect(cardIssuer.issue).toHaveBeenCalledTimes(4);
    expect(cardRepository.updateStatus).toHaveBeenCalledWith(
      mockData.requestId,
      'failed',
    );
    expect(eventPublisher.publishCardDlq).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          attempts: 4,
          message: 'servicio caído',
        }),
        originalPayload: mockData,
      }),
      'source',
    );
  });
});
