import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('today')
  @Auth()
  @ApiOperation({ summary: "Today's appointments + tomorrow count" })
  today() {
    return this.appointmentsService.today();
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'Appointments for a given ?date=YYYY-MM-DD (time order)' })
  findByDate(@Query('date') date: string) {
    return this.appointmentsService.findByDate(date);
  }

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Book an appointment (409 if slot taken)' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/status')
  @Auth()
  @ApiOperation({ summary: 'Update appointment status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.appointmentsService.updateStatus(id, dto);
  }
}
