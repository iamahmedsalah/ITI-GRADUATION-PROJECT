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
      enum: ["user", "assistant", "system"],
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
    links: [
      {
        type: {
          type: String,
          enum: ["roadmap", "course"],
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 200,
        },
        description: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        path: {
          type: String,
          required: true,
          trim: true,
          maxlength: 240,
        },
        slug: {
          type: String,
          trim: true,
          maxlength: 160,
        },
        level: {
          type: String,
          trim: true,
          maxlength: 40,
        },
        category: {
          type: String,
          trim: true,
          maxlength: 80,
        },
      },
    ],
  },
  { timestamps: true },
);

userAiMessageSchema.index({ conversation: 1, createdAt: 1 });

const UserAiMessage = mongoose.model("UserAiMessage", userAiMessageSchema);

export default UserAiMessage;
