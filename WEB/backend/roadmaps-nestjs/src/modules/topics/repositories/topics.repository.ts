import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Topic, TopicDocument } from '../schemas/topic.schema';

@Injectable()
export class TopicsRepository {
  constructor(
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
  ) {}

  async findByTopicId(topicId: string): Promise<Topic | null> {
    return this.topicModel.findOne({ topicId }).lean().exec();
  }

  async findByRoadmapId(roadmapId: string): Promise<Topic[]> {
    if (!Types.ObjectId.isValid(roadmapId)) {
      throw new BadRequestException(`Invalid roadmapId: ${roadmapId}`);
    }
    return this.topicModel
      .find({ roadmapId: new Types.ObjectId(roadmapId) })
      .lean()
      .exec();
  }
}
