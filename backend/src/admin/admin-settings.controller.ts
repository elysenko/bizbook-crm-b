import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@generated/prisma/client';
import { Auth } from 'src/auth/decorators';
import { AdminSettingsService } from './admin-settings.service';

@ApiTags('Admin Settings')
@ApiBearerAuth()
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @Auth(Role.admin)
  @ApiOperation({ summary: 'List service credentials with configured status (ADMIN only)' })
  list() {
    return this.adminSettingsService.list();
  }

  @Patch()
  @Auth(Role.admin)
  @ApiOperation({ summary: 'Upsert service credential values (ADMIN only)' })
  update(@Body() body: Record<string, unknown>) {
    return this.adminSettingsService.update(body);
  }
}
