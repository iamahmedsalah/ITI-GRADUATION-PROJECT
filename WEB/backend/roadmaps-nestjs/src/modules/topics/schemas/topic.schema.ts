import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TopicType } from '../enums/topicType.enum';
import { Position, PositionSchema } from './position.schema';
import { Resource, ResourceSchema } from './resource.schema';
import { Roadmap } from 'src/modules/roadmaps/schemas/roadmap.schema';

export type TopicDocument = HydratedDocument<Topic>;

@Schema({
  collection: 'topics',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      delete ret._id;
    },
  },
})
export class Topic {
  @Prop({
    required: true,
    unique: true,
    index: true,
    trim: true,
  })
  topicId: string;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  label: string;

  @Prop({
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    type: String,
    required: true,
    enum: TopicType,
  })
  type: TopicType;

  @Prop({
    type: Types.ObjectId,
    ref: Roadmap.name,
    required: true,
    index: true,
  })
  roadmapId: Types.ObjectId;

  @Prop({
    type: PositionSchema,
    required: true,
  })
  position: Position;

  @Prop({
    type: [ResourceSchema],
    default: [],
  })
  resources: Resource[];

  @Prop({
    trim: true,
    index: true,
  })
  parentTopicId?: string;

  @Prop({
    type: [String],
    default: [],
    index: true,
  })
  path: string[];
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
