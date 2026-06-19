import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ResourceDto {
  @Expose()
  @ApiProperty({
    example: 'article',
    description: 'Resource type, for example article, video, course, docs.',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @Expose()
  @ApiProperty({
    example: 'HTML Introduction',
    description: 'Resource title.',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @Expose()
  @ApiProperty({
    example: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
    description: 'Resource URL.',
  })
  @IsString()
  @IsUrl()
  link: string;
}
