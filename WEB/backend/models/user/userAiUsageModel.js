import mongoose from "mongoose";

const userAiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Please add an AI usage type"],
      enum: ["ai_roadmap_draft", "ai_chat", "ai_topic_explain"],
      index: true,
    },
    periodStart: {
      type: Date,
      required: [true, "Please add a usage period"],
      index: true,
    },
    count: {
      type: Number,
      min: 0,
      default: 0,
    },
    promptTokens: {
      type: Number,
      min: 0,
      default: 0,
    },
    completionTokens: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalTokens: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

userAiUsageSchema.index(
  { user: 1, type: 1, periodStart: 1 },
  { unique: true },
);

const UserAiUsage = mongoose.model("UserAiUsage", userAiUsageSchema);

export default UserAiUsage;