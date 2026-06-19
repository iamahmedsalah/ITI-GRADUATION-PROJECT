import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import UserRoadmap from "../../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../../models/user/userRoadmapStepProgressModel.js";
import { normalizePagination } from "../../helpers/pagination.js";
import { escapeRegex } from "../../helpers/text.js";
import {
  deleteRoadmapTemplateCore,
  publishRoadmapTemplateCore,
  unpublishRoadmapTemplateCore,
  updateRoadmapTemplateCore,
} from "../roadmap-template.service.js";
import {
  getRoadmapDisplaySource,
  logAdminAction,
  parseBooleanQuery,
} from "./admin-shared.js";

export const getAdminRoadmaps = async (req, res) => {
  const { q, targetRole, targetLevel, templateType, source, ownership, isActive, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = {};

    if (targetRole) query.targetRole = targetRole;
    if (targetLevel) query.targetLevel = targetLevel;
    if (source) query.source = source;
    if (ownership === "student") {
      query.owner = { $exists: true, $ne: null };
    } else if (ownership === "admin") {
      query.$and = [
        ...(query.$and || []),
        { $or: [{ owner: { $exists: false } }, { owner: null }] },
      ];
    }
    if (templateType === "roleBased") {
      query.$and = [
        ...(query.$and || []),
        { $or: [{ templateType: "roleBased" }, { templateType: { $exists: false } }] },
      ];
    } else if (templateType) {
      query.templateType = templateType;
    }
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
        .populate("owner", "username email Fname Lname")
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
      displaySource: getRoadmapDisplaySource(template),
      assignedUsers: assignmentsMap.get(String(template._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      message:
        data.length > 0
          ? "Roadmap templates retrieved successfully."
          : "No roadmap templates found.",
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
    const [template, assignments, assignedRoadmaps, stepProgressCount] = await Promise.all([
      RoadmapTemplate.findById(templateId)
        .populate("createdBy", "username email role Fname Lname")
        .populate("owner", "username email Fname Lname")
        .lean(),
      UserRoadmap.countDocuments({ template: templateId }),
      UserRoadmap.find({ template: templateId })
        .populate("user", "username Fname Lname email")
        .select("user status progressPercent updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
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
      message: "Roadmap template retrieved successfully.",
      data: {
        ...template,
        displaySource: getRoadmapDisplaySource(template),
        assignedUsers: assignments,
        assignedUsersList: assignedRoadmaps
          .filter((roadmap) => roadmap.user)
          .map((roadmap) => ({
            _id: roadmap._id,
            status: roadmap.status,
            progressPercent: roadmap.progressPercent,
            updatedAt: roadmap.updatedAt,
            user: roadmap.user,
          })),
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
