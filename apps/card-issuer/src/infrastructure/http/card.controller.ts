import {
  Body,
  Controller,
  ConflictException,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  RequestCardUseCase,
  DuplicateCardRequestError,
  EventPublishError,
} from '../../application/use-cases/request-card.use-case';
import { CardRequestRepositoryPort } from '../../domain/ports/card-request.repository.port';
import { IssueCardDto } from './dto/issue-card.dto';
import { IssueCardResponse } from './responses/issue-card.response';
import { CardStatusResponse } from './responses/card-status.response';
import { Inject } from '@nestjs/common';
import { CARD_REQUEST_REPOSITORY_PORT } from '../injection-tokens';

@ApiTags('cards')
@Controller('cards')
export class CardController {
  constructor(
    private readonly requestCardUseCase: RequestCardUseCase,
    @Inject(CARD_REQUEST_REPOSITORY_PORT)
    private readonly cardRequestRepository: CardRequestRepositoryPort,
  ) {}

  @Post('issue')
  @HttpCode(202)
  @ApiOperation({ summary: 'Solicitar emisión de tarjeta' })
  @ApiCreatedResponse({
    description: 'Solicitud registrada exitosamente',
    schema: { example: { requestId: 'uuid', status: 'pending' } },
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiConflictResponse({ description: 'El cliente ya tiene una tarjeta' })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  async issueCard(@Body() dto: IssueCardDto): Promise<IssueCardResponse> {
    try {
      return await this.requestCardUseCase.execute({
        documentType: dto.customer.documentType,
        documentNumber: dto.customer.documentNumber,
        fullName: dto.customer.fullName,
        age: dto.customer.age,
        email: dto.customer.email,
        cardType: dto.product.type,
        currency: dto.product.currency,
        forceError:
          process.env.NODE_ENV !== 'production' && (dto.forceError ?? false),
      });
    } catch (error) {
      if (error instanceof DuplicateCardRequestError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof EventPublishError) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }
  }

  @Get('status/:requestId')
  @ApiOperation({ summary: 'Consultar estado de una solicitud' })
  @ApiOkResponse({
    description: 'Estado de la solicitud',
    schema: {
      example: {
        requestId: 'uuid',
        status: 'issued',
        card: { cardNumber: '**** **** **** 1234', expiresAt: '04/29' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Solicitud no encontrada' })
  async getStatus(
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<CardStatusResponse> {
    const record = await this.cardRequestRepository.findByRequestId(requestId);

    if (!record) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (record.status === 'issued' && record.issuedCard) {
      return {
        requestId,
        status: record.status,
        card: {
          cardNumber: `**** **** **** ${record.issuedCard.cardNumber.slice(-4)}`,
          expiresAt: record.issuedCard.expiresAt,
        },
      };
    }

    return { requestId, status: record.status };
  }
}
