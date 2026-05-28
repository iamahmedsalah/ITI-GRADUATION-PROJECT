import crypto from "crypto";
import User from "../models/user/userAccountModel.js";
import UserProfile from "../models/user/userProfileModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import Course from "../models/course/courseModel.js";
import AdminActionLog from "../models/admin/adminActionLogModel.js";
import { resolveCourseImageUrls } from "../config/cloudinary.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mails/emails.js";
import generateTokenSetCookie, {
  getAuthCookieOptions,
} from "../utils/generateTokenSetCookie.js";
import {
  updateRoadmapTemplateCore,
  deleteRoadmapTemplateCore,
  publishRoadmapTemplateCore,
  unpublishRoadmapTemplateCore,
} from "./roadmaps.service.js";

const parseBooleanQuery = (value) => {
  if (value === undefined) return undefined;
  return value === "true";
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePagination = (page = 1, limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const getRequestIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip ||
  "unknown";

const logAdminAction = async ({
  req,
  adminId,
  action,
  targetType,
  targetId,
  metadata = {},
}) => {
  try {
    await AdminActionLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: getRequestIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });
  } catch (error) {
    console.error("Admin action log error:", error);
  }
};

const toPublicAdmin = (user) => ({
  _id: user._id,
  username: user.username,
  name: `${user.Fname} ${user.Lname}`,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
});

const ensureAdminRole = (user) => user?.role === "admin";

export const adminLogin = async (req, res) => {
  const body = req.body ?? {};
  const identifier = body.identifier || body.email || body.username;
  const { password } = body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter your admin email/username and password.",
    });
  }

  try {
    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    }).select("+password");

    if (!user || !ensureAdminRole(user)) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This admin account is deactivated.",
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const unlockTime = new Date(user.lockUntil).toLocaleString();
      return res.status(423).json({
        success: false,
        message: `Account locked until ${unlockTime} due to multiple failed login attempts.`,
      });
    }

    const isMatch = await user.comparePassword(String(password));

    if (!isMatch) {
      const MAX_FAILED = parseInt(process.env.MAX_FAILED_LOGIN, 10) || 5;
      const LOCK_TIME =
        parseInt(process.env.ACCOUNT_LOCK_TIME_MS, 10) || 60 * 60 * 1000;

      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "Admin email not verified.",
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();

    generateTokenSetCookie(res, user._id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      user: toPublicAdmin(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin login failed.",
      error: error.message,
    });
  }
};

export const adminVerifyEmail = async (req, res) => {
  try {
    const { code } = req.body ?? {};

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const user = await User.findOne({
      verificationToken: String(code),
      verificationTokenExpireAt: { $gt: Date.now() },
      role: "admin",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin verification code.",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpireAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, `${user.Fname} ${user.Lname}`);

    return res.status(200).json({
      success: true,
      message: "Admin email verified successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminForgetPassword = async (req, res) => {
  try {
    const { email } = req.body ?? {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      role: "admin",
    });

    if (user) {
      const resetToken = crypto.randomBytes(20).toString("hex");
      const hashedResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordToken = hashedResetToken;
      user.resetPasswordExpireAt = Date.now() + 60 * 60 * 1000;
      await user.save();

      const frontendBase =
        process.env.CLIENT_URL || process.env.PRODUCTION_URL || "";
      const resetURL = `${frontendBase}/reset-password/${resetToken}`;

      await sendPasswordResetEmail(
        user.email,
        resetURL,
        `${user.Fname} ${user.Lname}`,
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body ?? {};

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpireAt: { $gt: Date.now() },
      role: "admin",
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired admin reset link.",
      });
    }

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "Unknown";

    const device = req.headers["user-agent"] || "Unknown";

    const resetTime = new Date().toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    const location = "Approximate location unavailable";

    user.password = String(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpireAt = undefined;
    await user.save();

    const passwordChangedAt = new Date(
      user.passwordChangedAt || Date.now(),
    ).toLocaleString("en-US", {
      timeZone: "Africa/Cairo",
      dateStyle: "medium",
      timeStyle: "medium",
    });

    await sendResetSuccessEmail(user.email, `${user.Fname} ${user.Lname}`, {
      passwordChangedAt,
      resetTime,
      ipAddress,
      location,
      device,
    });

    return res.status(200).json({
      success: true,
      message: "Admin password reset successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const adminLogout = (_req, res) => {
  res.clearCookie("token", getAuthCookieOptions());
  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully.",
  });
};

export const adminCheckAuth = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Unauthorized admin access.",
    });
  }

  try {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: toPublicAdmin(req.user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: "Failed to check admin authentication.",
      error: error.message,
    });
  }
};

export const getAdminOverview = async (_req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      studentsCount,
      instructorsCount,
      adminsCount,
      totalRoadmaps,
      activeRoadmaps,
      totalAssignedRoadmaps,
      completedAssignedRoadmaps,
      inProgressAssignedRoadmaps,
      totalCourses,
      publishedCourses,
      featuredCourses,
      totalCourseEnrollments,
      completedCourseEnrollments,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      User.countDocuments({ role: "admin" }),
      RoadmapTemplate.countDocuments({}),
      RoadmapTemplate.countDocuments({ isActive: true }),
      UserRoadmap.countDocuments({}),
      UserRoadmap.countDocuments({ status: "completed" }),
      UserRoadmap.countDocuments({
        status: { $in: ["assigned", "inProgress", "paused"] },
      }),
      Course.countDocuments({ deletedAt: null }),
      Course.countDocuments({ isPublished: true, deletedAt: null }),
      Course.countDocuments({ isFeatured: true, deletedAt: null }),
      UserCourseProgress.countDocuments({}),
      UserCourseProgress.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          verified: verifiedUsers,
          byRole: {
            student: studentsCount,
            instructor: instructorsCount,
            admin: adminsCount,
          },
        },
        roadmaps: {
          templatesTotal: totalRoadmaps,
          templatesActive: activeRoadmaps,
          assignmentsTotal: totalAssignedRoadmaps,
          assignmentsCompleted: completedAssignedRoadmaps,
          assignmentsInProgress: inProgressAssignedRoadmaps,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          featured: featuredCourses,
          enrollmentsTotal: totalCourseEnrollments,
          enrollmentsCompleted: completedCourseEnrollments,
        },
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin overview.",
      error: error.message,
    });
  }
};

export const createCourseByAdmin = async (req, res) => {
  const adminId = req.user._id;

  try {
    const courseData = {
      ...req.body,
      deletedAt: null,
    };

    await resolveCourseImageUrls(courseData, { slug: courseData.slug });

    if (courseData.slug) {
      const existingBySlug = await Course.findOne({
        slug: courseData.slug,
      }).select("_id");
      if (existingBySlug) {
        return res.status(409).json({
          success: false,
          message: "This slug is already used by another course.",
        });
      }
    }

    if (courseData.instructor) {
      const instructor = await User.findOne({
        _id: courseData.instructor,
        role: { $in: ["instructor", "admin"] },
      }).select("_id");

      if (!instructor) {
        return res.status(400).json({
          success: false,
          message: "Instructor not found or is not an instructor or admin.",
        });
      }
    }

    if (courseData.roadmapTemplate) {
      const roadmapTemplate = await RoadmapTemplate.findById(
        courseData.roadmapTemplate,
      ).select("_id");
      if (!roadmapTemplate) {
        return res.status(400).json({
          success: false,
          message: "Roadmap template not found.",
        });
      }
    }

    const course = await Course.create(courseData);

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.create",
        targetType: "course",
        targetId: course._id,
        metadata: {
          title: course.title,
          slug: course.slug,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin create course error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A course with that ${duplicatedField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course.",
      error: error.message,
    });
  }
};

export const getAdminUsers = async (req, res) => {
  const { q, role, isVerified, isActive, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (role) query.role = role;
    if (isVerified !== undefined)
      query.isVerified = parseBooleanQuery(isVerified);
    if (isActive !== undefined) query.isActive = parseBooleanQuery(isActive);

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
          "_id username Fname Lname email role isVerified isActive lastLogin deactivatedAt deactivationReason createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
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
        "_id username Fname Lname email role isVerified isActive currentRoadmap lastLogin deactivatedAt deactivatedBy deactivationReason createdAt updatedAt",
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

    const [profile, preferences, roadmapStats, courseStats, activityCount] =
      await Promise.all([
        UserProfile.findOne({ user: userId }).lean(),
        UserPreference.findOne({ user: userId }).lean(),
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
        UserActivity.countDocuments({ user: user._id }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        preferences,
        stats: {
          roadmapsByStatus: roadmapStats,
          coursesByStatus: courseStats,
          activityCount,
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
  const { role, isVerified, isActive, deactivationReason } = req.body;
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
    };

    if (role !== undefined) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

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

export const getAdminRoadmaps = async (req, res) => {
  const { q, targetRole, targetLevel, isActive, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (targetRole) query.targetRole = targetRole;
    if (targetLevel) query.targetLevel = targetLevel;
    if (isActive !== undefined) query.isActive = parseBooleanQuery(isActive);

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { title: safeRegex },
        { goal: safeRegex },
        { description: safeRegex },
        { tags: safeRegex },
      ];
    }

    const [templates, total] = await Promise.all([
      RoadmapTemplate.find(query)
        .populate("createdBy", "username email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      RoadmapTemplate.countDocuments(query),
    ]);

    const templateIds = templates.map((t) => t._id);
    const assignments = await UserRoadmap.aggregate([
      { $match: { template: { $in: templateIds } } },
      { $group: { _id: "$template", assignedUsers: { $sum: 1 } } },
    ]);

    const assignmentsMap = new Map(
      assignments.map((item) => [String(item._id), item.assignedUsers]),
    );

    const data = templates.map((template) => ({
      ...template,
      assignedUsers: assignmentsMap.get(String(template._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin get roadmaps error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap templates.",
      error: error.message,
    });
  }
};

export const getAdminRoadmapById = async (req, res) => {
  const { templateId } = req.params;

  try {
    const [template, assignments, stepProgressCount] = await Promise.all([
      RoadmapTemplate.findById(templateId)
        .populate("createdBy", "username email role")
        .lean(),
      UserRoadmap.countDocuments({ template: templateId }),
      UserRoadmapStepProgress.countDocuments({ template: templateId }),
    ]);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Roadmap template not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...template,
        assignedUsers: assignments,
        totalStepProgressRecords: stepProgressCount,
      },
    });
  } catch (error) {
    console.error("Admin get roadmap by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap template.",
      error: error.message,
    });
  }
};

export const updateRoadmapByAdmin = async (req, res) => {
  const { templateId } = req.params;
  const adminId = req.user._id;

  try {
    const existingTemplate = await RoadmapTemplate.findById(templateId).select(
      "_id title slug isActive contentFormat",
    );

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: "Roadmap template not found.",
      });
    }

    const before = {
      title: existingTemplate.title,
      slug: existingTemplate.slug,
      isActive: existingTemplate.isActive,
      contentFormat: existingTemplate.contentFormat,
    };

    const template = await updateRoadmapTemplateCore({
      templateId,
      payload: req.body,
    });

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.roadmap.update",
        targetType: "roadmapTemplate",
        targetId: template._id,
        metadata: {
          before,
          after: {
            title: template.title,
            slug: template.slug,
            isActive: template.isActive,
            contentFormat: template.contentFormat,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template updated successfully.",
      data: template,
    });
  } catch (error) {
    console.error("Admin update roadmap error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A roadmap with that ${duplicatedField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update roadmap template.",
      error: error.message,
    });
  }
};

export const deleteRoadmapByAdmin = async (req, res) => {
  const { templateId } = req.params;
  const adminId = req.user._id;

  try {
    const deletedTemplate = await deleteRoadmapTemplateCore({ templateId });

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.roadmap.delete",
        targetType: "roadmapTemplate",
        targetId: deletedTemplate._id,
        metadata: {
          title: deletedTemplate.title,
          slug: deletedTemplate.slug,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template deleted successfully.",
      data: deletedTemplate,
    });
  } catch (error) {
    console.error("Admin delete roadmap error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete roadmap template.",
      error: error.message,
    });
  }
};

export const publishRoadmapByAdmin = async (req, res) => {
  const { templateId } = req.params;
  const adminId = req.user._id;

  try {
    const template = await publishRoadmapTemplateCore({ templateId });

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.roadmap.publish",
        targetType: "roadmapTemplate",
        targetId: template._id,
        metadata: { isActive: true },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template published successfully.",
      data: template,
    });
  } catch (error) {
    console.error("Admin publish roadmap error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to publish roadmap template.",
      error: error.message,
    });
  }
};

export const unpublishRoadmapByAdmin = async (req, res) => {
  const { templateId } = req.params;
  const adminId = req.user._id;

  try {
    const template = await unpublishRoadmapTemplateCore({ templateId });

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.roadmap.unpublish",
        targetType: "roadmapTemplate",
        targetId: template._id,
        metadata: { isActive: false },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template unpublished successfully.",
      data: template,
    });
  } catch (error) {
    console.error("Admin unpublish roadmap error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to unpublish roadmap template.",
      error: error.message,
    });
  }
};

export const getAdminCourses = async (req, res) => {
  const { q, level, isPublished, isFeatured, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = { deletedAt: null };

    if (level) query.level = level;
    if (isPublished !== undefined)
      query.isPublished = parseBooleanQuery(isPublished);
    if (isFeatured !== undefined)
      query.isFeatured = parseBooleanQuery(isFeatured);

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { title: safeRegex },
        { description: safeRegex },
        { shortDescription: safeRegex },
        { tags: safeRegex },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "username email role")
        .populate("roadmapTemplate", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
};

export const getAdminCourseById = async (req, res) => {
  const { courseId } = req.params;

  try {
    const [course, enrollments] = await Promise.all([
      Course.findById(courseId)
        .where({ deletedAt: null })
        .populate("instructor", "username email role")
        .populate("roadmapTemplate", "title slug")
        .lean(),
      UserCourseProgress.countDocuments({ course: courseId }),
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...course,
        enrollments,
      },
    });
  } catch (error) {
    console.error("Admin get course by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course.",
      error: error.message,
    });
  }
};

export const updateCourseByAdmin = async (req, res) => {
  const { courseId } = req.params;
  const adminId = req.user._id;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (req.body.slug && req.body.slug !== course.slug) {
      const existing = await Course.findOne({
        slug: req.body.slug,
        _id: { $ne: courseId },
      }).select("_id");

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This slug is already used by another course.",
        });
      }
    }

    // Validate course instructor reference
    if (req.body.instructor !== undefined) {
      if (req.body.instructor) {
        const instructor = await User.findOne({
          _id: req.body.instructor,
          role: { $in: ["instructor", "admin"] },
        }).select("_id");

        if (!instructor) {
          return res.status(400).json({
            success: false,
            message: "Instructor not found or is not an instructor or admin.",
          });
        }
      }
    }

    // Validate roadmapTemplate reference
    if (req.body.roadmapTemplate !== undefined) {
      if (req.body.roadmapTemplate) {
        const roadmapTemplate = await RoadmapTemplate.findById(
          req.body.roadmapTemplate,
        ).select("_id");

        if (!roadmapTemplate) {
          return res.status(400).json({
            success: false,
            message: "Roadmap template not found.",
          });
        }
      }
    }

    const updatePayload = { ...req.body };
    await resolveCourseImageUrls(updatePayload, {
      slug: updatePayload.slug || course.slug,
      courseId: course._id,
    });

    const updatableFields = [
      "title",
      "slug",
      "description",
      "shortDescription",
      "level",
      "category",
      "thumbnailUrl",
      "bannerUrl",
      "isPublished",
      "isFeatured",
      "instructor",
      "roadmapTemplate",
    ];

    const before = {
      title: course.title,
      slug: course.slug,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      level: course.level,
    };

    for (const field of updatableFields) {
      if (updatePayload[field] !== undefined) {
        course[field] = updatePayload[field];
      }
    }

    await course.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.update",
        targetType: "course",
        targetId: course._id,
        metadata: {
          before,
          after: {
            title: course.title,
            slug: course.slug,
            isPublished: course.isPublished,
            isFeatured: course.isFeatured,
            level: course.level,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin update course error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A course with that ${duplicatedField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update course.",
      error: error.message,
    });
  }
};

export const deleteCourseByAdmin = async (req, res) => {
  const { courseId } = req.params;
  const adminId = req.user._id;

  try {
    const enrollmentsCount = await UserCourseProgress.countDocuments({
      course: courseId,
    });

    if (enrollmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this course. It has ${enrollmentsCount} enrollment(s).`,
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Soft delete: set deletedAt instead of hard delete
    course.deletedAt = new Date();
    await course.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.delete",
        targetType: "course",
        targetId: course._id,
        metadata: {
          title: course.title,
          slug: course.slug,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin delete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course.",
      error: error.message,
    });
  }
};

export const getAdminActionLogs = async (req, res) => {
  const { targetType, action, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (targetType) query.targetType = targetType;
    if (action) query.action = new RegExp(`^${escapeRegex(action)}`, "i");

    const [logs, total] = await Promise.all([
      AdminActionLog.find(query)
        .populate("admin", "username email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      AdminActionLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin action logs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin logs.",
      error: error.message,
    });
  }
};
