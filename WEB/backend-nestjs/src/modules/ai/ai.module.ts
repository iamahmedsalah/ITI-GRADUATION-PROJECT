import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAiConversationSchema, UserAiMessageSchema, UserAiUsageSchema } from '../../database/schemas';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserAiConversation', schema: UserAiConversationSchema },
      { name: 'UserAiMessage', schema: UserAiMessageSchema },
      { name: 'UserAiUsage', schema: UserAiUsageSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
