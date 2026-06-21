import { HydratedDocument, Schema } from 'mongoose';

export type UserRoadmapDocument = HydratedDocument<Record<string, unknown>>;

export const UserRoadmapSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], index: true },
    template: { type: Schema.Types.ObjectId, ref: 'RoadmapTemplate', required: [true, 'Please add a roadmap template'], index: true },
    status: { type: String, enum: ['assigned', 'inProgress', 'paused', 'completed', 'archived'], default: 'assigned', index: true },
    currentStepIndex: { type: Number, default: 0, min: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    targetDate: Date,
    startedAt: Date,
    completedAt: Date,
    lastAccessedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: [2000, 'Notes must be at most 2000 characters'] },
  },
  { timestamps: true },
);

UserRoadmapSchema.index({ user: 1, template: 1 }, { unique: true });
UserRoadmapSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
