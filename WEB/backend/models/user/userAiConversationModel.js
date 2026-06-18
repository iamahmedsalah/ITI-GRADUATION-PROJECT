import mongoose from "mongoose";

const userAiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "New chat",
    },
    context: {
      page: {
        type: String,
        trim: true,
        maxlength: 120,
      },
      courseTitle: {
        type: String,
        trim: true,
        maxlength: 120,
      },
      roadmapTitle: {
        type: String,
        trim: true,
        maxlength: 120,
      },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

userAiConversationSchema.index({ user: 1, lastMessageAt: -1 });

const UserAiConversation = mongoose.model("UserAiConversation", userAiConversationSchema);

export default UserAiConversation;