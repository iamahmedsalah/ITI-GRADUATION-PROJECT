import mongoose from "mongoose";

const proAccessRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      index: true,
    },
    learningGoal: {
      type: String,
      enum: [
        "career-switch",
        "skill-up",
        "portfolio-project",
        "interview-prep",
        "academic-study",
        "other",
      ],
      required: [true, "Please choose a learning goal"],
      index: true,
    },
    needReason: {
      type: String,
      required: [true, "Please explain why you need Pro access"],
      trim: true,
      minlength: [20, "Reason must be at least 20 characters"],
      maxlength: [1000, "Reason must be at most 1000 characters"],
    },
    expectedDurationDays: {
      type: Number,
      enum: [7, 14, 30],
      required: [true, "Please choose an expected duration"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    adminNote: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin note must be at most 1000 characters"],
    },
    accessStartsAt: Date,
    accessEndsAt: Date,
  },
  { timestamps: true },
);

proAccessRequestSchema.index({ user: 1, status: 1, createdAt: -1 });

const ProAccessRequest = mongoose.model(
  "ProAccessRequest",
  proAccessRequestSchema,
);

export default ProAccessRequest;
