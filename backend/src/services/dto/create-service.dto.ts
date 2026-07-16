import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ description: 'Service name', example: 'Haircut' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Duration in minutes (> 0)', example: 30 })
  @IsInt()
  @Min(1)
  durationMin: number;

  @ApiProperty({ description: 'Price in cents (>= 0)', example: 2500 })
  @IsInt()
  @Min(0)
  priceCents: number;
}
