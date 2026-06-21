import { HydratedDocument, Schema } from 'mongoose';

export type AdminActionLogDocument = HydratedDocument<Record<string, unknown>>;

export const AdminActionLogSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add an admin user'], index: true },
    action: { type: String, required: [true, 'Please add an action'], trim: true, maxlength: [100, 'Action must be at most 100 characters'], index: true },
    targetType: { type: String, enum: ['user', 'roadmapTemplate', 'course', 'contactMessage', 'system'], required: [true, 'Please add a target type'], index: true },
    targetId: { type: Schema.Types.ObjectId, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true },
);

AdminActionLogSchema.index({ admin: 1, createdAt: -1 });
AdminActionLogSchema.index({ targetType: 1, createdAt: -1 });
AdminActionLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
