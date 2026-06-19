import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'roadmaps',
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_: any, ret: { _id: any; id?: string; [key: string]: any }) => {
      ret.id = ret._id.toString();
      delete ret._id;
    },
  },
})
export class Roadmap {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;
}

export type RoadmapDocument = HydratedDocument<Roadmap>;
export const RoadmapSchema = SchemaFactory.createForClass(Roadmap);
