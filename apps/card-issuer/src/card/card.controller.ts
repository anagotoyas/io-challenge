import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CardService } from './card.service';
import { IssueCardDto } from './dto/issue-card.dto';

@ApiTags('cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('issue')
  @HttpCode(201)
  @ApiOperation({ summary: 'Solicitar emisión de tarjeta' })
  issueCard(@Body() dto: IssueCardDto) {
    return this.cardService.issueCard(dto);
  }

  @Get('status/:requestId')
  @ApiOperation({ summary: 'Consultar estado de una solicitud' })
  getStatus(@Param('requestId') requestId: string) {
    return this.cardService.getStatus(requestId);
  }
}
