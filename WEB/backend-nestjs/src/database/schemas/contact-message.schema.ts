import { HydratedDocument, Schema } from 'mongoose';

export type ContactMessageDocument = HydratedDocument<Record<string, unknown>>;

const ContactReplySchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: {
      type: String,
      required: [true, 'Reply message is required.'],
      trim: true,
      maxlength: [5000, 'Reply must be at most 5000 characters.'],
    },
    messageId: { type: String, trim: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

export const ContactMessageSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name must be at most 80 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters.'],
      maxlength: [5000, 'Message must be at most 5000 characters.'],
    },
    status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread', index: true },
    adminNotificationMessageId: { type: String, trim: true },
    adminNotificationError: { type: String, trim: true },
    readAt: Date,
    lastRepliedAt: Date,
    replies: { type: [ContactReplySchema], default: [] },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true },
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ name: 'text', email: 'text', message: 'text' });
ContactMessageSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
