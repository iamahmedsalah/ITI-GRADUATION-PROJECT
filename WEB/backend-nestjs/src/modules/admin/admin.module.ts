import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminActionLogSchema, CourseSchema, RoadmapTemplateSchema, UserSchema } from '../../database/schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRoleGuard } from './guards/admin-role.guard';

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
  providers: [AdminService, JwtAuthGuard, AdminRoleGuard],
  exports: [AdminService],
})
export class AdminModule {}
