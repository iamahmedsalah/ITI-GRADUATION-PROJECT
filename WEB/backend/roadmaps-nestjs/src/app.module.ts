import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module';
import { TopicsModule } from './modules/topics/topics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        '../.env',
        '../../.env',
        '.env.local',
        '../.env.local',
        '../../.env.local',
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGODB_URI') ||
          configService.get<string>('DB_URL_FALLBACK') ||
          configService.get<string>('DB_URL');
        if (!uri) {
          throw new Error('MONGODB_URI or DB_URL is not defined');
        }

        return {
          uri,
          dbName: 'iti_Grad_Project',
        };
      },
    }),
    RoadmapsModule,
    TopicsModule,
  ],
})
export class AppModule {}
