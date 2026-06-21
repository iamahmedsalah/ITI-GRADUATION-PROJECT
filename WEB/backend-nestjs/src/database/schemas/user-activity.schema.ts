import { HydratedDocument, Schema } from 'mongoose';

export type UserActivityDocument = HydratedDocument<Record<string, unknown>>;

export const UserActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], index: true },
    type: {
      type: String,
      required: [true, 'Please add an activity type'],
      enum: [
        'course_view',
        'course_search',
        'course_bookmark',
        'course_enroll',
        'course_complete',
        'login',
        'lesson_complete',
        'roadmap_start',
        'roadmap_step_complete',
        'roadmap_complete',
        'ai_roadmap_draft',
        'ai_roadmap_save',
        'ai_chat',
        'ai_topic_explain',
        'rating',
        'quiz_attempt',
      ],
      index: true,
    },
    course: { type: Schema.Types.ObjectId, ref: 'Course', index: true },
    roadmap: { type: Schema.Types.ObjectId, ref: 'UserRoadmap', index: true },
    roadmapStepKey: { type: String, trim: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    durationMinutes: { type: Number, min: 0, default: 0 },
    score: { type: Number, min: 0, max: 100 },
    searchQuery: { type: String, trim: true, maxlength: [300, 'Search query must be at most 300 characters'] },
    device: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

UserActivitySchema.index({ user: 1, type: 1, occurredAt: -1 });
UserActivitySchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
