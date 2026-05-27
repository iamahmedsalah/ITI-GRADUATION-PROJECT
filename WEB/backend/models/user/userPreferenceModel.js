import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      unique: true,
      index: true,
    },
    interests: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    preferredLanguages: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    learningGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      index: true,
    },
    learningPace: {
      type: String,
      enum: ["slow", "medium", "fast"],
      default: "medium",
      index: true,
    },
    preferredCategories: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    preferredDifficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    weeklyStudyHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    reminderPreference: {
      type: String,
      enum: ["email", "push", "none"],
      default: "email",
    },
  },
  { timestamps: true }
);

userPreferenceSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserPreference = mongoose.model("UserPreference", userPreferenceSchema);

export default UserPreference;
