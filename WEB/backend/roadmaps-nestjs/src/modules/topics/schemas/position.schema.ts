import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Position {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;
}

export const PositionSchema = SchemaFactory.createForClass(Position);
