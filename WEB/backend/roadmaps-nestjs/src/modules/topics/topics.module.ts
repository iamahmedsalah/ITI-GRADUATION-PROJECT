// topics.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TopicsController } from './topics.controller';
import { TopicsRepository } from './repositories/topics.repository';
import { Topic, TopicSchema } from './schemas/topic.schema';
import { TopicsService } from './topics.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
  ],
  controllers: [TopicsController],
  providers: [TopicsService, TopicsRepository],
  exports: [TopicsRepository],
})
export class TopicsModule {}
