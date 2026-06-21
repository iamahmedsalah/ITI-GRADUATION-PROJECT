import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppLoggerModule } from './core/logger/logger.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { CoursesModule } from './modules/courses/courses.module';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './core/mail/mail.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '../.env', '../.env.local'],
    }),

    // Rate limiting (global defaults)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 15 * 60 * 1000, // 15 minutes
          limit: 100,
        },
      ],
    }),

    // Core modules
    AppLoggerModule,
    DatabaseModule,
    MailModule,
    CloudinaryModule,

    // Feature modules
    HealthModule,
    AuthModule,
    ContactModule,
    CoursesModule,
    RoadmapsModule,
    AiModule,
    AdminModule,
  ],
})
export class AppModule {}
