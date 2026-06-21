import { HydratedDocument, Schema } from 'mongoose';

export type UserAiConversationDocument = HydratedDocument<Record<string, unknown>>;

export const UserAiConversationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, maxlength: 30, default: 'New chat' },
    context: {
      page: { type: String, trim: true, maxlength: 120 },
      courseTitle: { type: String, trim: true, maxlength: 120 },
      roadmapTitle: { type: String, trim: true, maxlength: 120 },
    },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

UserAiConversationSchema.index({ user: 1, lastMessageAt: -1 });
