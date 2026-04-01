import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
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
import { CardService } from './card.service';
import { IssueCardDto } from './dto/issue-card.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('issue')
  @HttpCode(202)
  @ApiOperation({ summary: 'Solicitar emisión de tarjeta' })
  @ApiCreatedResponse({
    description: 'Solicitud registrada exitosamente',
    schema: {
      example: { requestId: 'uuid', status: 'pending' },
    },
  })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiConflictResponse({ description: 'El cliente ya tiene una tarjeta' })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  issueCard(@Body() dto: IssueCardDto) {
    return this.cardService.issueCard(dto);
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
  getStatus(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return this.cardService.getStatus(requestId);
  }
}
