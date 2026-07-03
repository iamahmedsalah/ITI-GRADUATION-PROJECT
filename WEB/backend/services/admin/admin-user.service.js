import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import User from "../../models/user/userAccountModel.js";
import UserActivity from "../../models/user/userActivityModel.js";
import UserCourseProgress from "../../models/user/userCourseProgressModel.js";
import ProAccessRequest from "../../models/user/proAccessRequestModel.js";
import UserPreference from "../../models/user/userPreferenceModel.js";
import UserProfile from "../../models/user/userProfileModel.js";
import UserRoadmap from "../../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../../models/user/userRoadmapStepProgressModel.js";
import { normalizePagination } from "../../helpers/pagination.js";
import { escapeRegex } from "../../helpers/text.js";
import { logAdminAction, parseBooleanQuery } from "./admin-shared.js";

export const getAdminUsers = async (req, res) => {
  const { q, role, isVerified, isActive, subscriptionPlan, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (role) query.role = role;
    if (isVerified !== undefined)
      query.isVerified = parseBooleanQuery(isVerified);
    if (isActive !== undefined) query.isActive = parseBooleanQuery(isActive);
    if (subscriptionPlan) query["subscription.plan"] = subscriptionPlan;

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { username: safeRegex },
        { email: safeRegex },
        { Fname: safeRegex },
        { Lname: safeRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select(
          "_id username Fname Lname email role isVerified isActive subscription lastLogin deactivatedAt deactivationReason createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: users.length > 0 ? "Users retrieved successfully." : "No users found.",
      data: users,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

export const getAdminUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId)
      .select(
        "_id username Fname Lname email role isVerified isActive subscription currentRoadmap lastLogin deactivatedAt deactivatedBy deactivationReason createdAt updatedAt",
      )
      .populate({
        path: "currentRoadmap",
        select: "status progressPercent template updatedAt",
        populate: { path: "template", select: "title slug" },
      })
      .populate("deactivatedBy", "username email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const [profile, preferences, roadmaps, courses, roadmapStats, courseStats, activities] =
      await Promise.all([
        UserProfile.findOne({ user: userId }).lean(),
        UserPreference.findOne({ user: userId }).lean(),
        UserRoadmap.find({ user: userId })
          .populate("template", "title slug targetLevel templateType source visibility estimatedTotalMinutes")
          .sort({ updatedAt: -1 })
          .lean(),
        UserCourseProgress.find({ user: userId })
          .populate("course", "title slug level category durationMinutes thumbnailUrl")
          .sort({ updatedAt: -1 })
          .lean(),
        UserRoadmap.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        UserCourseProgress.aggregate([
          { $match: { user: user._id } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        UserActivity.find({ user: userId })
          .populate("course", "title slug")
          .populate({
            path: "roadmap",
            select: "template progressPercent",
            populate: { path: "template", select: "title slug" },
          })
          .sort({ occurredAt: -1, createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    return res.status(200).json({
      success: true,
      message: "User details retrieved successfully.",
      data: {
        user,
        profile,
        preferences,
        roadmaps,
        courses,
        activities,
        stats: {
          roadmapsByStatus: roadmapStats,
          coursesByStatus: courseStats,
          activityCount: activities.length,
        },
      },
    });
  } catch (error) {
    console.error("Admin get user by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details.",
      error: error.message,
    });
  }
};

export const updateUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const { role, isVerified, isActive, subscriptionPlan, subscriptionStatus, deactivationReason } = req.body;
  const adminId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isSelf = String(adminId) === String(user._id);
    const isDemotingAdminRole =
      user.role === "admin" && role !== undefined && role !== "admin";
    const isDeactivatingAdmin =
      user.role === "admin" && isActive === false && user.isActive !== false;

    if (isSelf && isVerified !== undefined) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own verification status.",
      });
    }

    if (isSelf && isDemotingAdminRole) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role.",
      });
    }

    if (isSelf && isActive === false) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account.",
      });
    }

    if (isDemotingAdminRole || isDeactivatingAdmin) {
      const otherActiveAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: user._id },
      });

      if (otherActiveAdmins === 0) {
        return res.status(400).json({
          success: false,
          message:
            "This action is not allowed because the platform must keep at least one active admin.",
        });
      }
    }

    const previousData = {
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      subscription: user.subscription,
    };

    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (subscriptionPlan !== undefined || subscriptionStatus !== undefined) {
      const nextPlan = subscriptionPlan || user.subscription?.plan || "free";
      user.subscription = {
        plan: nextPlan,
        status:
          subscriptionStatus ||
          (nextPlan === "pro" ? "active" : "inactive"),
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
      };
    }

    if (isActive !== undefined) {
      user.isActive = isActive;

      if (isActive === false) {
        user.deactivatedAt = new Date();
        user.deactivatedBy = adminId;
        user.deactivationReason = deactivationReason || user.deactivationReason;
        // Invalidate all active sessions by setting passwordChangedAt
        // This causes all JWT tokens issued before this time to be rejected
        user.passwordChangedAt = new Date();
      } else {
        user.deactivatedAt = undefined;
        user.deactivatedBy = undefined;
        user.deactivationReason = undefined;
      }
    } else if (deactivationReason !== undefined) {
      user.deactivationReason = deactivationReason;
    }

    await user.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.user.update",
        targetType: "user",
        targetId: user._id,
        metadata: {
          before: previousData,
          after: {
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            subscription: user.subscription,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: {
        _id: user._id,
        username: user.username,
        Fname: user.Fname,
        Lname: user.Lname,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        subscription: user.subscription,
        deactivatedAt: user.deactivatedAt,
        deactivationReason: user.deactivationReason,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user.",
      error: error.message,
    });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (String(adminId) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    if (user.role === "admin" && user.isActive !== false) {
      const otherActiveAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: user._id },
      });

      if (otherActiveAdmins === 0) {
        return res.status(400).json({
          success: false,
          message:
            "This action is not allowed because the platform must keep at least one active admin.",
        });
      }
    }

    const [userRoadmaps, ownedTemplates] = await Promise.all([
      UserRoadmap.find({ user: user._id }).select("_id").lean(),
      RoadmapTemplate.find({ owner: user._id }).select("_id").lean(),
    ]);
    const userRoadmapIds = userRoadmaps.map((roadmap) => roadmap._id);
    const ownedTemplateIds = ownedTemplates.map((template) => template._id);

    await Promise.all([
      UserProfile.deleteMany({ user: user._id }),
      UserPreference.deleteMany({ user: user._id }),
      UserActivity.deleteMany({ user: user._id }),
      UserCourseProgress.deleteMany({ user: user._id }),
      ProAccessRequest.deleteMany({ user: user._id }),
      UserRoadmapStepProgress.deleteMany({
        $or: [
          { user: user._id },
          { roadmap: { $in: userRoadmapIds } },
          { template: { $in: ownedTemplateIds } },
        ],
      }),
      UserRoadmap.deleteMany({ user: user._id }),
      RoadmapTemplate.deleteMany({ owner: user._id }),
    ]);

    await User.deleteOne({ _id: user._id });

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.user.delete",
        targetType: "user",
        targetId: user._id,
        metadata: {
          username: user.username,
          email: user.email,
          role: user.role,
          deletedRoadmaps: userRoadmapIds.length,
          deletedOwnedTemplates: ownedTemplateIds.length,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
      error: error.message,
    });
  }
};
