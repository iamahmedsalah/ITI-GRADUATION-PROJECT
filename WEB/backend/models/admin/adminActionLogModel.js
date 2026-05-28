import mongoose from "mongoose";

const adminActionLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add an admin user"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Please add an action"],
      trim: true,
      maxlength: [100, "Action must be at most 100 characters"],
      index: true,
    },
    targetType: {
      type: String,
      enum: ["user", "roadmapTemplate", "course", "system"],
      required: [true, "Please add a target type"],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

adminActionLogSchema.index({ admin: 1, createdAt: -1 });
adminActionLogSchema.index({ targetType: 1, createdAt: -1 });

adminActionLogSchema.set("toJSON", {
  transform: function (_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const AdminActionLog = mongoose.model("AdminActionLog", adminActionLogSchema);

export default AdminActionLog;
