import AdminActionLog from "../../models/admin/adminActionLogModel.js";
import ContactMessage from "../../models/contact/contactMessageModel.js";
import Course from "../../models/course/courseModel.js";
import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import User from "../../models/user/userAccountModel.js";
import UserCourseProgress from "../../models/user/userCourseProgressModel.js";
import UserRoadmap from "../../models/user/userRoadmapModel.js";
import { normalizePagination } from "../../helpers/pagination.js";
import { escapeRegex } from "../../helpers/text.js";

export const getAdminOverview = async (_req, res) => {
  try {
    const onlineSince = new Date(Date.now() - 15 * 60 * 1000);
    const [
      totalUsers,
      activeUsers,
      onlineUsers,
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
      totalContactMessages,
      unreadContactMessages,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, lastLogin: { $gte: onlineSince } }),
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
      ContactMessage.countDocuments({}),
      ContactMessage.countDocuments({ status: "unread" }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin overview retrieved successfully.",
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          online: onlineUsers,
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
        contactMessages: {
          total: totalContactMessages,
          unread: unreadContactMessages,
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
      message:
        logs.length > 0
          ? "Admin action logs retrieved successfully."
          : "No admin action logs found.",
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
