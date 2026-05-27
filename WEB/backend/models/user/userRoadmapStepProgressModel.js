import mongoose from "mongoose";

const userRoadmapStepProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRoadmap",
      required: [true, "Please add a roadmap"],
      index: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTemplate",
      required: [true, "Please add a roadmap template"],
      index: true,
    },
    stepKey: {
      type: String,
      required: [true, "Please add a step key"],
      trim: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    status: {
      type: String,
      enum: ["notStarted", "inProgress", "completed", "skipped"],
      default: "notStarted",
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    timeSpentMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    attempts: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes must be at most 2000 characters"],
    },
  },
  { timestamps: true }
);

userRoadmapStepProgressSchema.index(
  { user: 1, roadmap: 1, stepKey: 1 },
  { unique: true }
);

userRoadmapStepProgressSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserRoadmapStepProgress = mongoose.model(
  "UserRoadmapStepProgress",
  userRoadmapStepProgressSchema
);

export default UserRoadmapStepProgress;
