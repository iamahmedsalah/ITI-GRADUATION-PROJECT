import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorDto {
  @ApiProperty({
    example: 'NOT_FOUND',
    description: 'Machine-readable error code.',
  })
  code: string;

  @ApiProperty({
    example: 'Topic not found',
    description: 'Human-readable error message.',
  })
  message: string;
}

export class ApiSuccessResponseDto<T = unknown> {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the request was successful.',
  })
  success: boolean;

  @ApiProperty({
    description: 'Returned response data.',
  })
  data: T;

  @ApiProperty({
    example: '2026-06-14T09:41:54.000Z',
    description: 'ISO timestamp when the response was generated.',
  })
  timestamp: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Indicates whether the request was successful.',
  })
  success: boolean;

  @ApiProperty({
    type: ApiErrorDto,
    description: 'Error details.',
  })
  error: ApiErrorDto;

  @ApiProperty({
    example: '2026-06-14T09:41:54.000Z',
    description: 'ISO timestamp when the response was generated.',
  })
  timestamp: string;
}
