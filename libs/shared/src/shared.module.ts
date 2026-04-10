import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { NestJsLoggerAdapter, LOGGER_PORT } from './logger/logger.adapter';

@Module({
  providers: [
    PrismaService,
    NestJsLoggerAdapter,
    { provide: LOGGER_PORT, useExisting: NestJsLoggerAdapter },
  ],
  exports: [PrismaService, NestJsLoggerAdapter, LOGGER_PORT],
})
export class SharedModule {}
