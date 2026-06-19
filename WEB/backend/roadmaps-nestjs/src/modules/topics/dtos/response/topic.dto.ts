import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TopicType } from '../../enums/topicType.enum';
import { PositionDto } from '../position.dto';
import { ResourceDto } from '../resource.dto';
import { Expose, Type } from 'class-transformer';

export class TopicDtoResponse {
  @ApiProperty({
    example: 'html-basics',
    description: 'Unique topic ID used by the application.',
  })
  @Expose()
  topicId: string;

  @ApiProperty({
    example: 'HTML Basics',
    description: 'Internal topic name.',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'HTML',
    description: 'Display label shown on the roadmap UI.',
  })
  @Expose()
  label: string;

  @ApiProperty({
    example: 'Learn the basics of HTML structure and semantic elements.',
    description: 'Topic description.',
  })
  @Expose()
  description: string;

  @ApiProperty({
    enum: TopicType,
    example: TopicType.TOPIC,
    description: 'Topic type.',
  })
  @Expose()
  type: TopicType;

  @ApiProperty({
    example: 'frontend-roadmap',
    description: 'ID of the roadmap this topic belongs to.',
  })
  @Expose()
  roadmapId: string;

  @ApiProperty({
    type: PositionDto,
    description: 'Topic position in the roadmap canvas.',
  })
  @Type(() => PositionDto)
  @Expose()
  position: PositionDto;

  @ApiProperty({
    type: [ResourceDto],
    description: 'Learning resources related to this topic.',
  })
  @Type(() => ResourceDto)
  @Expose()
  resources: ResourceDto[];

  @ApiProperty({
    example: 'anything',
    description: 'Direct parent topicId',
  })
  @Expose()
  parentTopicId?: string;

  @ApiProperty({
    example: '[introduction, learn a language, c++]',
    description: 'Ids of the topic ancestors in order',
  })
  @Expose()
  path: string[];

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the topic was created.',
  })
  @Expose()
  createdAt?: string;

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the topic was last updated.',
  })
  @Expose()
  updatedAt?: string;
}
