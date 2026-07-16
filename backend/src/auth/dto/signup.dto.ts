import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ description: 'Full name', example: 'Jane Owner' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'Email', example: 'owner@bizbook.demo' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 6 chars)', example: 'secret123' })
  @IsString()
  @MinLength(6)
  password: string;
}
