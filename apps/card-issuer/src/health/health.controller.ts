import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@app/shared';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio y dependencias' })
  async check() {
    const checks = await Promise.allSettled([this.checkDatabase()]);

    const db = checks[0];

    const status = {
      status: db.status === 'fulfilled' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'card-issuer',
      dependencies: {
        database: db.status === 'fulfilled' ? 'ok' : 'unavailable',
      },
    };

    if (status.status === 'degraded') {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }

  private async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
