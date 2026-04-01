import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CardModule } from './card/card.module';
import { HealthController } from './health/health.controller';
import { LoggerModule } from '@app/shared';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, CardModule],
  controllers: [HealthController],
})
export class CardIssuerModule {}
