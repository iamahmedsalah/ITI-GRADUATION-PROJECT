import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please add a user"],
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio must be at most 500 characters"],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    timeZone: {
      type: String,
      trim: true,
      default: "UTC",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location must be at most 120 characters"],
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [140, "Headline must be at most 140 characters"],
    },
    linkedInUrl: {
      type: String,
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

userProfileSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
