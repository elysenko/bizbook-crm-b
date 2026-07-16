import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsBusinessSlot, IsDateOnly } from '../appointments.validators';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'Client id', example: 'c_123' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Service id', example: 's_123' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)', example: '2026-07-16' })
  @IsDateOnly()
  date: string;

  @ApiProperty({ description: '30-min slot 08:00–18:00', example: '09:00' })
  @IsBusinessSlot()
  startTime: string;
}
