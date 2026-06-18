import mongoose from "mongoose";

const userAiMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAiConversation",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 6000,
    },
    provider: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
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

userAiMessageSchema.index({ conversation: 1, createdAt: 1 });

const UserAiMessage = mongoose.model("UserAiMessage", userAiMessageSchema);

export default UserAiMessage;