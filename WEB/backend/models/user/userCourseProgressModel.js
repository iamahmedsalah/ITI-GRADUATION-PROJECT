import mongoose from "mongoose";

const userCourseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Please add a course"],
      index: true,
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRoadmap",
      index: true,
    },
    status: {
      type: String,
      enum: ["notStarted", "inProgress", "completed", "abandoned"],
      default: "notStarted",
      index: true,
    },
    currentLesson: {
      type: String,
      trim: true,
    },
    completedLessonIds: [
      {
        type: String,
        trim: true,
      },
    ],
    progressPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    watchedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes must be at most 2000 characters"],
    },
  },
  { timestamps: true }
);

userCourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

userCourseProgressSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserCourseProgress = mongoose.model(
  "UserCourseProgress",
  userCourseProgressSchema
);

export default UserCourseProgress;
