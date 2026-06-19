// import { Topic } from '../schemas/topic.schema';
// import { TopicResponseDto } from '../dtos/response/topic-response.dto';
// import { PositionResponseDto } from '../dtos/response/position-response.dto';
// import { ResourceResponseDto } from '../dtos/response/resource-response.dto';
// import { ChildTopicResponseDto } from '../dtos/response/child-topic-response.dto';

// type TopicLike = Topic & {
//   createdAt?: Date | string;
//   updatedAt?: Date | string;
// };

// export class TopicMapper {
//   static toResponseDto(topic: TopicLike): TopicResponseDto {
//     return {
//       id: topic.id,
//       name: topic.name,
//       label: topic.label,
//       description: topic.description,
//       type: topic.type,
//       roadmapId: topic.roadmapId,

//       position: {
//         x: topic.position.x,
//         y: topic.position.y,
//       } satisfies PositionResponseDto,

//       resources: (topic.resources || []).map(
//         (resource): ResourceResponseDto => ({
//           type: resource.type,
//           title: resource.title,
//           link: resource.link,
//         }),
//       ),

//       childTopics: (topic.childTopics || []).map(
//         (childTopic): ChildTopicResponseDto => ({
//           targetId: childTopic.targetId,
//           relation: childTopic.relation,
//         }),
//       ),

//       createdAt: topic.createdAt
//         ? new Date(topic.createdAt).toISOString()
//         : undefined,

//       updatedAt: topic.updatedAt
//         ? new Date(topic.updatedAt).toISOString()
//         : undefined,
//     };
//   }

//   static toResponseDtoList(topics: TopicLike[]): TopicResponseDto[] {
//     return topics.map((topic) => this.toResponseDto(topic));
//   }
// }
