import { HydratedDocument, Schema } from 'mongoose';

export type UserRoadmapStepProgressDocument = HydratedDocument<Record<string, unknown>>;

export const UserRoadmapStepProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], index: true },
    roadmap: { type: Schema.Types.ObjectId, ref: 'UserRoadmap', required: [true, 'Please add a roadmap'], index: true },
    template: { type: Schema.Types.ObjectId, ref: 'RoadmapTemplate', required: [true, 'Please add a roadmap template'], index: true },
    stepKey: { type: String, required: [true, 'Please add a step key'], trim: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    status: { type: String, enum: ['notStarted', 'inProgress', 'completed', 'skipped'], default: 'notStarted', index: true },
    startedAt: Date,
    completedAt: Date,
    score: { type: Number, min: 0, max: 100, default: 0 },
    timeSpentMinutes: { type: Number, min: 0, default: 0 },
    attempts: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: [2000, 'Notes must be at most 2000 characters'] },
  },
  { timestamps: true },
);

UserRoadmapStepProgressSchema.index({ user: 1, roadmap: 1, stepKey: 1 }, { unique: true });
UserRoadmapStepProgressSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
