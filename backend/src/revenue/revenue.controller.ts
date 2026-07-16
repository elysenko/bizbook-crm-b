import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';
import { Auth } from 'src/auth/decorators';
import { RevenueService } from './revenue.service';

@ApiTags('Revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  @Auth(Role.admin)
  @ApiOperation({ summary: 'Monthly revenue from completed appointments (ADMIN only)' })
  byMonth() {
    return this.revenueService.byMonth();
  }
}
