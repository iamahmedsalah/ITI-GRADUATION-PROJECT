import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminActionLogSchema, CourseSchema, RoadmapTemplateSchema, UserSchema } from '../../database/schemas';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'AdminActionLog', schema: AdminActionLogSchema },
      { name: 'Course', schema: CourseSchema },
      { name: 'RoadmapTemplate', schema: RoadmapTemplateSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
