import { Injectable, Logger } from '@nestjs/common';
import { LoggerPort } from '../../domain/ports/logger.port';

@Injectable()
export class NestJsLoggerAdapter implements LoggerPort {
  private readonly logger = new Logger('RequestCardUseCase');

  log(context: Record<string, unknown>, message: string): void {
    this.logger.log(context, message);
  }

  warn(context: Record<string, unknown>, message: string): void {
    this.logger.warn(context, message);
  }

  error(context: Record<string, unknown>, message: string): void {
    this.logger.error(context, message);
  }
}
