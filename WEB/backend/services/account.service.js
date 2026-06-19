import crypto from "crypto";
import User from "../models/user/userAccountModel.js";
import UserProfile from "../models/user/userProfileModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserAiUsage from "../models/user/userAiUsageModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";

import {
  sendAccountDeletionCodeEmail,
  sendAccountDeletionUndoCodeEmail,
} from "../mails/emails.js";
import { clearAuthCookies } from "../utils/generateTokenSetCookie.js";
import {
  generateVerificationToken,
  toPublicUser,
} from "../helpers/auth.helpers.js";

const ACCOUNT_DELETE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;
const ACCOUNT_ACTION_CODE_TTL_MS = 15 * 60 * 1000;

const hashAccountActionCode = (code) =>
  crypto
    .createHash("sha256")
    .update(String(code).trim().toUpperCase())
    .digest("hex");

const issueAccountDeletionEmail = async (user, reason) => {
  const code = generateVerificationToken();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + ACCOUNT_DELETE_GRACE_PERIOD_MS);

  user.accountDeletion = {
    status: "pendingConfirmation",
    requestedAt: now,
    scheduledFor,
    reason,
    verificationTokenHash: hashAccountActionCode(code),
    verificationTokenExpireAt: new Date(now.getTime() + ACCOUNT_ACTION_CODE_TTL_MS),
    undoTokenHash: undefined,
    undoTokenExpireAt: undefined,
  };
  await user.save();

  await sendAccountDeletionCodeEmail({
    email: user.email,
    name: `${user.Fname} ${user.Lname}`,
    code,
    scheduledFor,
  });

  return scheduledFor;
};

const issueAccountDeletionUndoEmail = async (user) => {
  const code = generateVerificationToken();

  user.accountDeletion = {
    ...(user.accountDeletion?.toObject?.() ?? user.accountDeletion ?? {}),
    undoTokenHash: hashAccountActionCode(code),
    undoTokenExpireAt: new Date(Date.now() + ACCOUNT_ACTION_CODE_TTL_MS),
  };
  await user.save();

  await sendAccountDeletionUndoCodeEmail({
    email: user.email,
    name: `${user.Fname} ${user.Lname}`,
    code,
  });
};

const clearAccountDeletionState = (user) => {
  user.accountDeletion = {
    status: "none",
    requestedAt: undefined,
    confirmedAt: undefined,
    scheduledFor: undefined,
    reason: undefined,
    verificationTokenHash: undefined,
    verificationTokenExpireAt: undefined,
    undoTokenHash: undefined,
    undoTokenExpireAt: undefined,
  };
};

const deleteUserOwnedData = async (userId) => {
  await Promise.all([
    UserProfile.deleteMany({ user: userId }),
    UserPreference.deleteMany({ user: userId }),
    UserActivity.deleteMany({ user: userId }),
    UserAiUsage.deleteMany({ user: userId }),
    UserCourseProgress.deleteMany({ user: userId }),
    UserRoadmapStepProgress.deleteMany({ user: userId }),
    UserRoadmap.deleteMany({ user: userId }),
  ]);

  await User.findByIdAndDelete(userId);
};

export const purgeDueDeletedAccounts = async () => {
  const dueUsers = await User.find({
    "accountDeletion.status": "scheduled",
    "accountDeletion.scheduledFor": { $lte: new Date() },
  })
    .select("_id")
    .limit(20)
    .lean();

  for (const user of dueUsers) {
    await deleteUserOwnedData(user._id);
  }
};

export const deactivateCurrentAccount = async (req, res) => {
  try {
    const { password, reason } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deactivated from the user profile.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = undefined;
    user.deactivationReason = reason || "Self-deactivated by user.";
    user.passwordChangedAt = new Date();
    await user.save();
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Account deactivated. Log in with your password to reactivate it.",
    });
  } catch (error) {
    console.error("Deactivate current account error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not deactivate account.",
    });
  }
};

export const requestAccountDeletion = async (req, res) => {
  try {
    const { password, reason } = req.body;
    const user = await User.findById(req.user._id).select("+password +accountDeletion.verificationTokenHash");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deleted from the user profile.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }

    if (user.accountDeletion?.status === "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Account deletion is already scheduled.",
        scheduledFor: user.accountDeletion?.scheduledFor ?? null,
      });
    }

    const scheduledFor = await issueAccountDeletionEmail(user, reason);

    return res.status(200).json({
      success: true,
      message: "A deletion verification code has been sent to your email.",
      scheduledFor,
    });
  } catch (error) {
    console.error("Request account deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not start account deletion.",
    });
  }
};

export const confirmAccountDeletion = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id).select("+accountDeletion.verificationTokenHash");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const deletion = user.accountDeletion ?? {};
    const expectedHash = deletion.verificationTokenHash;
    const submittedHash = hashAccountActionCode(code);

    if (
      deletion.status !== "pendingConfirmation" ||
      !expectedHash ||
      expectedHash !== submittedHash ||
      !deletion.verificationTokenExpireAt ||
      deletion.verificationTokenExpireAt <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired deletion code.",
      });
    }

    const scheduledFor = deletion.scheduledFor ?? new Date(Date.now() + ACCOUNT_DELETE_GRACE_PERIOD_MS);

    user.accountDeletion = {
      ...(deletion.toObject?.() ?? deletion),
      status: "scheduled",
      confirmedAt: new Date(),
      scheduledFor,
      verificationTokenHash: undefined,
      verificationTokenExpireAt: undefined,
      undoTokenHash: undefined,
      undoTokenExpireAt: undefined,
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account deletion confirmed. Your account will be deleted after 7 days unless you undo it.",
      scheduledFor,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Confirm account deletion error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not confirm account deletion.",
    });
  }
};

export const requestAccountDeletionUndo = async (req, res) => {
  try {
    await purgeDueDeletedAccounts();

    const { identifier, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password +accountDeletion.undoTokenHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    if (user.accountDeletion?.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "This account does not have a scheduled deletion.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/username or password.",
      });
    }

    await issueAccountDeletionUndoEmail(user);

    return res.status(200).json({
      success: true,
      message: "An undo verification code has been sent to your email.",
      scheduledFor: user.accountDeletion?.scheduledFor ?? null,
    });
  } catch (error) {
    console.error("Request account deletion undo error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not start deletion undo.",
    });
  }
};

export const confirmAccountDeletionUndo = async (req, res) => {
  try {
    const { code } = req.body;
    const submittedHash = hashAccountActionCode(code);
    const user = await User.findOne({
      "accountDeletion.status": "scheduled",
      "accountDeletion.undoTokenHash": submittedHash,
      "accountDeletion.undoTokenExpireAt": { $gt: new Date() },
    }).select("+accountDeletion.undoTokenHash");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired undo code.",
      });
    }

    clearAccountDeletionState(user);
    user.isActive = true;
    user.deactivatedAt = undefined;
    user.deactivatedBy = undefined;
    user.deactivationReason = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account deletion canceled. You can log in again.",
    });
  } catch (error) {
    console.error("Confirm account deletion undo error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not undo account deletion.",
    });
  }
};

export default {
  deactivateCurrentAccount,
  requestAccountDeletion,
  confirmAccountDeletion,
  requestAccountDeletionUndo,
  confirmAccountDeletionUndo,
};
