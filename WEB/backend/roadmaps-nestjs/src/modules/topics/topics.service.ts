import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicsRepository } from './repositories/topics.repository';

import { plainToInstance } from 'class-transformer';
import { TopicDtoResponse } from './dtos/response/topic.dto';

@Injectable()
export class TopicsService {
  constructor(private readonly topicsRepository: TopicsRepository) {}

  async findByTopicId(topicId: string): Promise<TopicDtoResponse> {
    const topic = await this.topicsRepository.findByTopicId(topicId);

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${topicId} not found`);
    }

    return plainToInstance(TopicDtoResponse, topic, {
      excludeExtraneousValues: true,
    });
  }

  async findAllByRoadmapId(roadmapId: string) {
    return this.topicsRepository.findByRoadmapId(roadmapId);
  }
}
