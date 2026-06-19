import { Injectable, NotFoundException } from '@nestjs/common';

import { RoadmapsRepository } from './repositories/roadmaps.repository';
import { TopicsRepository } from '../topics/repositories/topics.repository';
import {
  RoadmapTreeDtoResponse,
  TopicTreeDto,
} from './dtos/response/roadmapTree.dto';
import { Topic } from '../topics/schemas/topic.schema';
import { toRoadmapTreeDto, toTopicTreeDto } from './mappers/roadmap.mapper';
import { RoadmapResponseDto } from './dtos/response/roadmap.dto';

@Injectable()
export class RoadmapsService {
  constructor(
    private readonly roadmapsRepository: RoadmapsRepository,
    private readonly topicsRepository: TopicsRepository,
  ) {}

  async findAll(): Promise<RoadmapResponseDto[]> {
    return await this.roadmapsRepository.findAll();
  }
  async getRoadmapTree(roadmapId: string): Promise<RoadmapTreeDtoResponse> {
    const roadmap = await this.roadmapsRepository.findById(roadmapId);
    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${roadmapId} not found`);
    }
    const startingTopics = await this.buildTree(roadmapId);
    return toRoadmapTreeDto(roadmap, startingTopics);
  }

  private async buildTree(roadmapId: string): Promise<TopicTreeDto[]> {
    const topics = await this.topicsRepository.findByRoadmapId(roadmapId);
    console.log(topics.length);
    console.log(topics[0]);
    const childrenMap = new Map<string, Topic[]>();

    // Group by parentId
    // parentId => [child ids]
    /**
     * we might have more than disconnected components
     *  for every disconnected component,  we will have a starting node/topic that has parentTopicId = ""
     *  in that case we will make an imaginary node/topic called "root" and we will make all the starting nodes points to it
     */
    for (const topic of topics) {
      const parentId = topic.parentTopicId || 'root';
      const childList = childrenMap.get(parentId) || [];
      childList.push(topic);
      childrenMap.set(parentId, childList);
    }

    const buildRecursive = (parentId: string): TopicTreeDto[] => {
      const children = childrenMap.get(parentId) || [];
      return children.map((topic) => {
        const node = toTopicTreeDto(topic);
        node.childTopics = buildRecursive(topic.topicId);
        return node;
      });
    };

    // without the shared root trick, we would have to find the starting nodes one by one
    return buildRecursive('root');
  }
}
