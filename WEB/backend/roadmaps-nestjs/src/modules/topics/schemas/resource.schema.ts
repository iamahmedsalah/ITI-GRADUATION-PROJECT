import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Resource {
  @Prop({
    required: true,
    trim: true,
  })
  type: string;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
  })
  link: string;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
