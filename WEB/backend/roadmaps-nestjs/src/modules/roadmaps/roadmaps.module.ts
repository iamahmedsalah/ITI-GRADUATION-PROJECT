// roadmaps.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsRepository } from './repositories/roadmaps.repository';
import { Roadmap, RoadmapSchema } from './schemas/roadmap.schema';
import { TopicsModule } from '../topics/topics.module'; // ← import the module, not the repository

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Roadmap.name, schema: RoadmapSchema }]),
    TopicsModule,
  ],
  controllers: [RoadmapsController],
  providers: [RoadmapsService, RoadmapsRepository],
})
export class RoadmapsModule {}
