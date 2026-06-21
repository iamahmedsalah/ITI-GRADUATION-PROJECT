import { HydratedDocument, Schema } from 'mongoose';

export type UserCourseProgressDocument = HydratedDocument<Record<string, unknown>>;

export const UserCourseProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: [true, 'Please add a course'], index: true },
    roadmap: { type: Schema.Types.ObjectId, ref: 'UserRoadmap', index: true },
    status: { type: String, enum: ['notStarted', 'inProgress', 'completed', 'abandoned'], default: 'notStarted', index: true },
    currentLesson: { type: String, trim: true },
    completedLessonIds: [{ type: String, trim: true }],
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    watchedMinutes: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    startedAt: Date,
    completedAt: Date,
    lastAccessedAt: { type: Date, default: Date.now },
    notes: { type: String, trim: true, maxlength: [2000, 'Notes must be at most 2000 characters'] },
  },
  { timestamps: true },
);

UserCourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });
UserCourseProgressSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
