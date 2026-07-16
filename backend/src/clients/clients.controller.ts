import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List clients (optional ?q= name/phone search)' })
  findAll(@Query('q') q?: string) {
    return this.clientsService.findAll(q);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Create a client' })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get a client by id' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Update a client' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Get(':id/appointments')
  @Auth()
  @ApiOperation({ summary: 'List a client appointment history (past + upcoming)' })
  findAppointments(@Param('id') id: string) {
    return this.clientsService.findAppointments(id);
  }
}
