import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Roadmap, RoadmapDocument } from '../schemas/roadmap.schema';

@Injectable()
export class RoadmapsRepository {
  constructor(
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<RoadmapDocument>,
  ) {}

  async findAll(): Promise<RoadmapDocument[]> {
    return this.roadmapModel.find().exec();
  }

  async findById(id: string): Promise<RoadmapDocument | null> {
    return this.roadmapModel.findById(id).exec();
  }

  async existsById(id: string): Promise<boolean> {
    const roadmap = await this.roadmapModel.exists({ id });
    return !!roadmap;
  }
}
