import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactMessageSchema } from '../../database/schemas';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'ContactMessage', schema: ContactMessageSchema }])],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
