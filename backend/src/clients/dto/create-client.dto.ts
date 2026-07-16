import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'Client full name', example: 'Maya Chen' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '(415) 555-0132' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Email', required: false, example: 'maya@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Free-form notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
