import { Topic } from 'src/modules/topics/schemas/topic.schema';
import {
  RoadmapTreeDtoResponse,
  TopicTreeDto,
} from '../dtos/response/roadmapTree.dto';
import { RoadmapDocument } from '../schemas/roadmap.schema';

export function toTopicTreeDto(topic: Topic): TopicTreeDto {
  return {
    topicId: topic.topicId,
    name: topic.name,
    label: topic.label,
    description: topic.description,
    type: topic.type,
    roadmapId: topic.roadmapId.toString(),
    position: topic.position,
    resources: topic.resources,
    childTopics: [],
  };
}

export function toRoadmapTreeDto(
  roadmap: RoadmapDocument,
  childTopics: TopicTreeDto[],
): RoadmapTreeDtoResponse {
  return {
    id: roadmap._id.toString(),
    name: roadmap.name,
    childTopics: childTopics,
  };
}

export function toRoadmaoResponseDto(roadmap: RoadmapDocument) {
  return {
    id: roadmap._id.toString(),
    name: roadmap.name,
  };
}
