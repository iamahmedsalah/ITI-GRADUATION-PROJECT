import mongoose from 'mongoose';
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username must be at most 20 characters"],
      index: true,
    },
    Fname: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [20, "First name must be at most 20 characters"],
    },
    Lname: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [20, "Last name must be at most 20 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Please add an email"],
      unique: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
      index: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    loginStreak: {
      current: {
        type: Number,
        default: 0,
        min: 0,
      },
      longest: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastLoginDate: {
        type: Date,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deactivatedAt: Date,
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deactivationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Deactivation reason must be at most 500 characters"],
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpireAt: Date,
    verificationToken: { type: String, select: false },
    verificationTokenExpireAt: Date,
    passwordChangedAt: Date,
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: Date,
    currentRoadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserRoadmap",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
        index: true,
      },
      status: {
        type: String,
        enum: ["inactive", "active", "trialing", "pastDue", "canceled"],
        default: "inactive",
        index: true,
      },
      currentPeriodEnd: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(String(this.password), saltRounds);
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, String(this.password));
};

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpireAt;
    delete ret.verificationToken;
    delete ret.verificationTokenExpireAt;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
