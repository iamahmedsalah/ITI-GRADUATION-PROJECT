import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RoadmapTemplateSchema,
  UserRoadmapSchema,
  UserRoadmapStepProgressSchema,
} from '../../database/schemas';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RoadmapTemplate', schema: RoadmapTemplateSchema },
      { name: 'UserRoadmap', schema: UserRoadmapSchema },
      { name: 'UserRoadmapStepProgress', schema: UserRoadmapStepProgressSchema },
    ]),
  ],
  controllers: [RoadmapsController],
  providers: [RoadmapsService],
  exports: [RoadmapsService],
})
export class RoadmapsModule {}
