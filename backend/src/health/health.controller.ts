import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Public } from 'src/auth/decorators';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService
  ) {}

  @Get()
  @Public()
  status() {
    return { status: 'ok' };
  }

  @Get('deep')
  @Public()
  async deep() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      throw new InternalServerErrorException({ status: 'error', db: 'down' });
    }
  }

  @Get('live')
  @Public()
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma)]);
  }
}
