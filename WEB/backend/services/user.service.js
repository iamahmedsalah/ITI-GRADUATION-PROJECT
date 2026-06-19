import mongoose from "mongoose";
import User from "../models/user/userAccountModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import { resolveUserAvatarUrl } from "../config/cloudinary.js";
import { toPublicUser } from "../helpers/auth.helpers.js";

export const getPreferences = async (req, res) => {
  try {
    const preferences = await UserPreference.findOne({ user: req.user._id }).lean();

    return res.status(200).json({
      success: true,
      data: preferences ?? null,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load preferences.",
    });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const preferences = await UserPreference.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          ...req.body,
          user: req.user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Preferences saved successfully.",
      data: preferences,
      user: toPublicUser(req.user, { hasPreferences: true }),
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save preferences.",
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const [roadmaps, stepTimeByRoadmap, courses] = await Promise.all([
      UserRoadmap.find({ user: userId, status: { $ne: "archived" } })
        .populate("template", "title slug templateType targetLevel estimatedTotalMinutes tags")
        .sort({ lastAccessedAt: -1, updatedAt: -1 })
        .lean(),
      UserRoadmapStepProgress.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$roadmap",
            timeSpentMinutes: { $sum: "$timeSpentMinutes" },
            completedSteps: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]),
      UserCourseProgress.find({ user: userId })
        .populate("course", "title slug level category durationMinutes thumbnailUrl")
        .sort({ lastAccessedAt: -1, updatedAt: -1 })
        .lean(),
    ]);

    const activities = await UserActivity.find({ user: userId })
      .populate("course", "title slug")
      .populate({
        path: "roadmap",
        select: "template progressPercent",
        populate: {
          path: "template",
          select: "title slug tags",
        },
      })
      .sort({ occurredAt: -1, createdAt: -1 })
      .limit(30)
      .lean();

    const timeByRoadmapId = new Map(
      stepTimeByRoadmap.map((item) => [
        String(item._id),
        {
          timeSpentMinutes: item.timeSpentMinutes ?? 0,
          completedSteps: item.completedSteps ?? 0,
        },
      ]),
    );

    const roadmapItems = roadmaps.map((roadmap) => ({
      ...roadmap,
      timeSpentMinutes: timeByRoadmapId.get(String(roadmap._id))?.timeSpentMinutes ?? 0,
      completedSteps: timeByRoadmapId.get(String(roadmap._id))?.completedSteps ?? 0,
    }));

    const totalRoadmapMinutes = roadmapItems.reduce(
      (sum, roadmap) => sum + (roadmap.timeSpentMinutes ?? 0),
      0,
    );
    const totalCourseMinutes = courses.reduce(
      (sum, courseProgress) => sum + (courseProgress.watchedMinutes ?? 0),
      0,
    );
    const totalCompletedSteps = roadmapItems.reduce(
      (sum, roadmap) => sum + (roadmap.completedSteps ?? 0),
      0,
    );
    const activeRoadmaps = roadmapItems.filter((roadmap) =>
      ["assigned", "inProgress", "paused"].includes(roadmap.status),
    ).length;
    const completedRoadmaps = roadmapItems.filter((roadmap) => roadmap.status === "completed").length;
    const activeCourses = courses.filter((course) =>
      ["notStarted", "inProgress"].includes(course.status),
    ).length;
    const completedCourses = courses.filter((course) => course.status === "completed").length;
    const averageRoadmapProgress = roadmapItems.length
      ? Math.round(
          roadmapItems.reduce((sum, roadmap) => sum + (roadmap.progressPercent ?? 0), 0) /
            roadmapItems.length,
        )
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(req.user),
        streak: req.user.loginStreak ?? { current: 0, longest: 0, lastLoginDate: null },
        totals: {
          roadmaps: roadmapItems.length,
          activeRoadmaps,
          completedRoadmaps,
          courses: courses.length,
          activeCourses,
          completedCourses,
          totalRoadmapMinutes,
          totalCourseMinutes,
          totalLearningMinutes: totalRoadmapMinutes + totalCourseMinutes,
          averageRoadmapProgress,
          totalCompletedSteps,
        },
        roadmaps: roadmapItems,
        courses,
        activities,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load dashboard summary.",
    });
  }
};

export const deleteUserActivity = async (req, res) => {
  const { activityId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(activityId)) {
    return res.status(400).json({
      success: false,
      message: "Activity ID must be valid.",
    });
  }

  try {
    const deletedActivity = await UserActivity.findOneAndDelete({
      _id: activityId,
      user: req.user._id,
    }).lean();

    if (!deletedActivity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully.",
      data: deletedActivity,
    });
  } catch (error) {
    console.error("Delete user activity error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete activity.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { username, Fname, Lname } = req.body;

    if (username && username !== user.username) {
      const usernameOwner = await User.findOne({
        username,
        _id: { $ne: user._id },
      }).select("_id");

      if (usernameOwner) {
        return res.status(409).json({
          success: false,
          message: "Validation failed.",
          errors: [{ field: "username", message: "Username is already taken." }],
        });
      }

      user.username = username;
    }

    if (Fname) {
      user.Fname = Fname;
    }

    if (Lname) {
      user.Lname = Lname;
    }

    await user.save();
    const hasPreferences = await UserPreference.exists({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: toPublicUser(user, { hasPreferences }),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Validation failed.",
        errors: [{ field: "username", message: "Username is already taken." }],
      });
    }

    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update profile.",
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update password.",
    });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const avatarUrl = await resolveUserAvatarUrl(req.body.avatarImage, {
      userId: user._id,
      username: user.username,
    });

    user.avatarUrl = avatarUrl;
    await user.save();
    const hasPreferences = await UserPreference.exists({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully.",
      user: toPublicUser(user, { hasPreferences }),
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Could not update avatar.",
    });
  }
};
