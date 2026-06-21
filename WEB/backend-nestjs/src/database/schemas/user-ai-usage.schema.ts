import { HydratedDocument, Schema } from 'mongoose';

export type UserAiUsageDocument = HydratedDocument<Record<string, unknown>>;

export const UserAiUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], index: true },
    type: { type: String, required: [true, 'Please add an AI usage type'], enum: ['ai_roadmap_draft', 'ai_chat', 'ai_topic_explain'], index: true },
    periodStart: { type: Date, required: [true, 'Please add a usage period'], index: true },
    count: { type: Number, min: 0, default: 0 },
    promptTokens: { type: Number, min: 0, default: 0 },
    completionTokens: { type: Number, min: 0, default: 0 },
    totalTokens: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

UserAiUsageSchema.index({ user: 1, type: 1, periodStart: 1 }, { unique: true });
