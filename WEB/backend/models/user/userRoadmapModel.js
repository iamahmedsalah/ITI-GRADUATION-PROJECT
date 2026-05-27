import mongoose from "mongoose";

const userRoadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTemplate",
      required: [true, "Please add a roadmap template"],
      index: true,
    },
    status: {
      type: String,
      enum: ["assigned", "inProgress", "paused", "completed", "archived"],
      default: "assigned",
      index: true,
    },
    currentStepIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    targetDate: {
      type: Date,
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

userRoadmapSchema.index({ user: 1, template: 1 }, { unique: true });

userRoadmapSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserRoadmap = mongoose.model("UserRoadmap", userRoadmapSchema);

export default UserRoadmap;
