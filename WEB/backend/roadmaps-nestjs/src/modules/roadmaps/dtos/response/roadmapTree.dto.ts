import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PositionDto } from 'src/modules/topics/dtos/position.dto';
import { ResourceDto } from 'src/modules/topics/dtos/resource.dto';
import { TopicType } from 'src/modules/topics/enums/topicType.enum';

export class TopicTreeDto {
  @ApiProperty({
    example: 'html-basics',
    description: 'Unique topic ID used by the application.',
  })
  topicId: string;

  @ApiProperty({
    example: 'HTML Basics',
    description: 'Internal topic name.',
  })
  name: string;

  @ApiProperty({
    example: 'HTML',
    description: 'Display label shown on the roadmap UI.',
  })
  label: string;

  @ApiProperty({
    example: 'Learn the basics of HTML structure and semantic elements.',
    description: 'Topic description.',
  })
  description: string;

  @ApiProperty({
    enum: TopicType,
    example: TopicType.TOPIC,
    description: 'Topic type.',
  })
  type: TopicType;

  @ApiProperty({
    example: 'frontend-roadmap',
    description: 'ID of the roadmap this topic belongs to.',
  })
  roadmapId: string;

  @ApiProperty({
    type: PositionDto,
    description: 'Topic position in the roadmap canvas.',
  })
  position: PositionDto;

  @ApiProperty({
    type: [ResourceDto],
    description: 'Learning resources related to this topic.',
  })
  resources: ResourceDto[];

  @ApiProperty({
    type: () => [TopicTreeDto],
    description: 'A list of childTopics',
  })
  childTopics: TopicTreeDto[];

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the topic was created.',
  })
  createdAt?: string;

  @ApiPropertyOptional({
    example: '2026-06-14T09:41:54.000Z',
    description: 'Date when the topic was last updated.',
  })
  updatedAt?: string;
}

export class RoadmapTreeDtoResponse {
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

  @ApiProperty({
    type: () => [TopicTreeDto],
    description: 'A list of starting Topics',
  })
  childTopics: TopicTreeDto[];

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
