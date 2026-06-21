import { HydratedDocument, Schema } from 'mongoose';

export type UserPreferenceDocument = HydratedDocument<Record<string, unknown>>;

export const UserPreferenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Please add a user'], unique: true, index: true },
    interests: [{ type: String, trim: true, lowercase: true }],
    preferredLanguages: [{ type: String, trim: true, lowercase: true }],
    learningGoals: [{ type: String, trim: true }],
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    learningPace: { type: String, enum: ['slow', 'medium', 'fast'], default: 'medium', index: true },
    preferredCategories: [{ type: String, trim: true, lowercase: true }],
    preferredDifficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    weeklyStudyHours: { type: Number, min: 0, default: 0 },
    reminderPreference: { type: String, enum: ['email', 'push', 'none'], default: 'email' },
  },
  { timestamps: true },
);

UserPreferenceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as Record<string, unknown>).__v;
    return ret;
  },
});
