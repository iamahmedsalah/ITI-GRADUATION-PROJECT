import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Please add an activity type"],
      enum: [
        "course_view",
        "course_search",
        "course_bookmark",
        "course_enroll",
        "course_complete",
        "login",
        "lesson_complete",
        "roadmap_start",
        "roadmap_step_complete",
        "roadmap_complete",
        "rating",
        "quiz_attempt",
      ],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRoadmap",
      index: true,
    },
    roadmapStepKey: {
      type: String,
      trim: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    searchQuery: {
      type: String,
      trim: true,
      maxlength: [300, "Search query must be at most 300 characters"],
    },
    device: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

userActivitySchema.index({ user: 1, type: 1, occurredAt: -1 });

userActivitySchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

export default UserActivity;
