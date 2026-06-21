import { HydratedDocument, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = HydratedDocument<Record<string, unknown>> & {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

export const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      index: true,
    },
    Fname: {
      type: String,
      required: [true, 'Please add a first name'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [20, 'First name must be at most 20 characters'],
    },
    Lname: {
      type: String,
      required: [true, 'Please add a last name'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [20, 'Last name must be at most 20 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'Please add an email'],
      unique: true,
      index: true,
    },
    avatarUrl: { type: String, trim: true },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
      index: true,
    },
    lastLogin: { type: Date, default: Date.now },
    loginStreak: {
      current: { type: Number, default: 0, min: 0 },
      longest: { type: Number, default: 0, min: 0 },
      lastLoginDate: Date,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    deactivatedAt: Date,
    deactivatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deactivationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Deactivation reason must be at most 500 characters'],
    },
    accountDeletion: {
      status: {
        type: String,
        enum: ['none', 'pendingConfirmation', 'scheduled'],
        default: 'none',
        index: true,
      },
      requestedAt: Date,
      confirmedAt: Date,
      scheduledFor: { type: Date, index: true },
      reason: { type: String, trim: true, maxlength: [500, 'Deletion reason must be at most 500 characters'] },
      verificationTokenHash: { type: String, select: false },
      verificationTokenExpireAt: Date,
      undoTokenHash: { type: String, select: false },
      undoTokenExpireAt: Date,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpireAt: Date,
    verificationToken: { type: String, select: false },
    verificationTokenExpireAt: Date,
    passwordChangedAt: Date,
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: Date,
    currentRoadmap: { type: Schema.Types.ObjectId, ref: 'UserRoadmap' },
    subscription: {
      plan: { type: String, enum: ['free', 'pro'], default: 'free', index: true },
      status: {
        type: String,
        enum: ['inactive', 'active', 'trialing', 'pastDue', 'canceled'],
        default: 'inactive',
        index: true,
      },
      currentPeriodEnd: Date,
    },
  },
  { timestamps: true },
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '', 10) || 12;
  this.set('password', await bcrypt.hash(String(this.get('password')), saltRounds));
  this.set('passwordChangedAt', Date.now() - 1000);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, String(this.password));
};

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const output = ret as Record<string, unknown>;
    delete output.password;
    delete output.resetPasswordToken;
    delete output.resetPasswordExpireAt;
    delete output.verificationToken;
    delete output.verificationTokenExpireAt;
    delete output.__v;
    return ret;
  },
});
