import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PositionDto {
  @Expose()
  @ApiProperty({
    example: 100,
    description: 'X coordinate of the topic in the roadmap canvas.',
  })
  @IsNumber()
  x: number;

  @Expose()
  @ApiProperty({
    example: 200,
    description: 'Y coordinate of the topic in the roadmap canvas.',
  })
  @IsNumber()
  y: number;
}
