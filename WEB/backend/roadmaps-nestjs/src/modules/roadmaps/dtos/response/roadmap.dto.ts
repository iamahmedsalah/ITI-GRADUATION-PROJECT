import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoadmapResponseDto {
  @ApiProperty({
    example: 'frontend-roadmap',
    description: 'Unique roadmap ID used by the application.',
  })
  id: string;

  @ApiProperty({
    example: 'Frontend Developer Roadmap',
    description: 'Roadmap name.',
  })
  name: string;

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the roadmap was created.',
  })
  createdAt?: string;

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the roadmap was last updated.',
  })
  updatedAt?: string;
}
