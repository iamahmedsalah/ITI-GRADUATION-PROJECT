import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import logger from "../utils/logger.js";
import {
  slugifyStepKey,
  ensureUniqueStepKeys,
  parseRoadmapMarkdownToSteps,
  calculateEstimatedTotalMinutes,
  escapeRegex,
  createServiceError,
  publicTemplateFilter,
} from "../helpers/roadmap.helpers.js";

//  ROADMAP TEMPLATE SERVICES

export const createRoadmapTemplate = async (req, res) => {
  const userId = req.user._id;
  const {
    title,
    slug,
    goal,
    description,
    targetRole,
    targetLevel,
    templateType,
    tags,
    steps,
    estimatedTotalMinutes,
    source,
    contentFormat,
    contentMarkdown,
  } = req.body;

  try {
    const existingSlug = await RoadmapTemplate.findOne({ slug }).select("_id");

    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: "This slug is already taken.",
        errors: [{ field: "slug", message: "Slug must be unique." }],
      });
    }

    const hasJsonSteps = Array.isArray(steps) && steps.length > 0;
    const markdownDerivedSteps = !hasJsonSteps && contentMarkdown
      ? parseRoadmapMarkdownToSteps(contentMarkdown)
      : [];

    const normalizedSteps = ensureUniqueStepKeys(
      hasJsonSteps ? steps : markdownDerivedSteps,
    );

    if (!normalizedSteps.length) {
      return res.status(400).json({
        success: false,
        message:
          "Roadmap must include at least one step (from JSON or markdown headings).",
      });
    }

    const newTemplate = await RoadmapTemplate.create({
      title,
      slug,
      goal,
      description,
      targetRole: targetRole || "student",
      targetLevel: targetLevel || "beginner",
      templateType: templateType || "roleBased",
      tags: tags || [],
      steps: normalizedSteps,
      estimatedTotalMinutes:
        estimatedTotalMinutes ??
        calculateEstimatedTotalMinutes(normalizedSteps),
      source: source || "manual",
      contentFormat: contentFormat || (contentMarkdown ? "markdown" : "json"),
      contentMarkdown,
      createdBy: userId,
      isActive: true,
    });

    const populatedTemplate = await RoadmapTemplate.findById(newTemplate._id)
      .populate("createdBy", "username email")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Roadmap template created successfully.",
      data: populatedTemplate,
    });
  } catch (error) {
    logger.error("Create roadmap template error", error);

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
      message: "Failed to create roadmap template.",
      error: error.message,
    });
  }
};

export const getRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    const template = await RoadmapTemplate.findOne({
      _id: templateId,
      ...publicTemplateFilter(),
    })
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template retrieved successfully.",
      data: template,
    });
  } catch (error) {
    logger.error("Get roadmap template error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap template.",
      error: error.message,
    });
  }
};

export const getRoadmapTemplateBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const template = await RoadmapTemplate.findOne({
      slug: String(slug).trim().toLowerCase(),
      ...publicTemplateFilter(),
    })
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template retrieved successfully.",
      data: template,
    });
  } catch (error) {
    logger.error("Get roadmap template by slug error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap template.",
      error: error.message,
    });
  }
};

export const getMyRoadmapTemplateBySlug = async (req, res) => {
  const { slug } = req.params;
  const userId = req.user._id;

  try {
    const template = await RoadmapTemplate.findOne({
      slug: String(slug).trim().toLowerCase(),
      isActive: true,
      $or: [
        { visibility: "public" },
        { visibility: { $exists: false } },
        { owner: userId, visibility: "private" },
      ],
    })
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template retrieved successfully.",
      data: template,
    });
  } catch (error) {
    logger.error("Get my roadmap template by slug error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap template.",
      error: error.message,
    });
  }
};

export const getRoadmapTopic = async (req, res) => {
  const { templateId, stepKey } = req.params;

  try {
    const template = await RoadmapTemplate.findOne({
      _id: templateId,
      ...publicTemplateFilter(),
    }).select("title slug steps");

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    const topic = template.steps.find((step) => step.stepKey === stepKey);

    if (!topic) {
      return res
        .status(404)
        .json({ success: false, message: "Topic not found in this roadmap." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap topic retrieved successfully.",
      data: {
        roadmap: {
          _id: template._id,
          title: template.title,
          slug: template.slug,
        },
        topic,
      },
    });
  } catch (error) {
    logger.error("Get roadmap topic error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap topic.",
      error: error.message,
    });
  }
};

export const getAllRoadmapTemplates = async (req, res) => {
  const { targetLevel, targetRole, templateType, page = 1, limit = 10 } = req.query;

  try {
    const query = publicTemplateFilter();

    if (targetLevel) query.targetLevel = targetLevel;
    if (targetRole) query.targetRole = targetRole;
    if (templateType === "roleBased") {
      query.$and = [{ $or: [{ templateType: "roleBased" }, { templateType: { $exists: false } }] }];
    } else if (templateType) {
      query.templateType = templateType;
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const templates = await RoadmapTemplate.find(query)
      .populate("createdBy", "username email Fname Lname")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await RoadmapTemplate.countDocuments(query);

    return res.status(200).json({
      success: true,
      message:
        templates.length > 0
          ? "Roadmap templates retrieved successfully."
          : "No roadmap templates found.",
      data: templates,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    logger.error("Get all roadmap templates error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap templates.",
      error: error.message,
    });
  }
};

export const searchRoadmapsAndTopics = async (req, res) => {
  const { q = "", targetLevel, targetRole, templateType, limit = 10 } = req.query;

  try {
    const queryText = String(q).trim();
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const baseFilters = publicTemplateFilter();

    if (targetLevel) baseFilters.targetLevel = targetLevel;
    if (targetRole) baseFilters.targetRole = targetRole;
    if (templateType === "roleBased") {
      baseFilters.$and = [{ $or: [{ templateType: "roleBased" }, { templateType: { $exists: false } }] }];
    } else if (templateType) {
      baseFilters.templateType = templateType;
    }

    const roadmapQuery = { ...baseFilters };

    if (queryText) {
      const safeRegex = new RegExp(escapeRegex(queryText), "i");
      const searchFilters = [
        { title: safeRegex },
        { goal: safeRegex },
        { description: safeRegex },
        { tags: safeRegex },
        { "steps.title": safeRegex },
        { "steps.description": safeRegex },
      ];
      roadmapQuery.$and = [...(roadmapQuery.$and || []), { $or: searchFilters }];
    }

    const roadmaps = await RoadmapTemplate.find(roadmapQuery)
      .select(
        "title slug goal description targetRole targetLevel templateType tags estimatedTotalMinutes steps isActive createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    let topics = [];

    if (queryText) {
      const safeRegex = new RegExp(escapeRegex(queryText), "i");
      topics = await RoadmapTemplate.aggregate([
        { $match: baseFilters },
        { $unwind: "$steps" },
        {
          $match: {
            $or: [
              { "steps.title": safeRegex },
              { "steps.description": safeRegex },
              { "steps.stepKey": safeRegex },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            templateId: "$_id",
            templateTitle: "$title",
            templateSlug: "$slug",
            topic: "$steps",
          },
        },
        { $sort: { "topic.order": 1 } },
        { $limit: parsedLimit * 3 },
      ]);
    }

    return res.status(200).json({
      success: true,
      message:
        roadmaps.length > 0 || topics.length > 0
          ? "Search results retrieved successfully."
          : "No roadmaps or topics found.",
      data: {
        roadmaps,
        topics,
        query: queryText,
      },
    });
  } catch (error) {
    logger.error("Search roadmaps/topics error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search roadmaps/topics.",
      error: error.message,
    });
  }
};

export const updateRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    const updatedTemplate = await updateRoadmapTemplateCore({
      templateId,
      payload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Roadmap template updated successfully.",
      data: updatedTemplate,
    });
  } catch (error) {
    logger.error("Update roadmap template error", error);

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

export const deleteRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    const deletedTemplate = await deleteRoadmapTemplateCore({ templateId });

    return res.status(200).json({
      success: true,
      message: "Roadmap template deleted successfully.",
      data: deletedTemplate,
    });
  } catch (error) {
    logger.error("Delete roadmap template error", error);

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

export const publishRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    const publishedTemplate = await publishRoadmapTemplateCore({ templateId });

    return res.status(200).json({
      success: true,
      message: "Roadmap template published successfully.",
      data: publishedTemplate,
    });
  } catch (error) {
    logger.error("Publish roadmap template error", error);

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

export const unpublishRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    const unpublishedTemplate = await unpublishRoadmapTemplateCore({
      templateId,
    });

    return res.status(200).json({
      success: true,
      message: "Roadmap template unpublished successfully.",
      data: unpublishedTemplate,
    });
  } catch (error) {
    logger.error("Unpublish roadmap template error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unpublish roadmap template.",
      error: error.message,
    });
  }
};

export const updateRoadmapTemplateCore = async ({ templateId, payload }) => {
  const {
    title,
    slug,
    goal,
    description,
    targetRole,
    targetLevel,
    templateType,
    tags,
    steps,
    estimatedTotalMinutes,
    isActive,
    contentFormat,
    contentMarkdown,
  } = payload;

  const existingTemplate = await RoadmapTemplate.findById(templateId).select(
    "_id steps contentFormat contentMarkdown",
  );

  if (!existingTemplate) {
    throw createServiceError(404, "Roadmap template not found.");
  }

  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (goal !== undefined) updateData.goal = goal;
  if (description !== undefined) updateData.description = description;
  if (targetRole !== undefined) updateData.targetRole = targetRole;
  if (targetLevel !== undefined) updateData.targetLevel = targetLevel;
  if (templateType !== undefined) updateData.templateType = templateType;
  if (tags !== undefined) updateData.tags = tags;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (contentFormat !== undefined) updateData.contentFormat = contentFormat;
  if (contentMarkdown !== undefined)
    updateData.contentMarkdown = contentMarkdown;

  let nextSteps = Array.isArray(existingTemplate.steps)
    ? [...existingTemplate.steps]
    : [];

  if (steps !== undefined) {
    nextSteps = ensureUniqueStepKeys(steps);
  } else if (contentMarkdown !== undefined || contentFormat === "markdown") {
    const markdownSource =
      contentMarkdown !== undefined
        ? contentMarkdown
        : existingTemplate.contentMarkdown;
    const parsedSteps = parseRoadmapMarkdownToSteps(markdownSource);
    if (parsedSteps.length) nextSteps = parsedSteps;
  }

  if (!nextSteps.length) {
    throw createServiceError(
      400,
      "Roadmap must include at least one step (from JSON or markdown headings).",
    );
  }

  updateData.steps = nextSteps;

  if (estimatedTotalMinutes !== undefined) {
    updateData.estimatedTotalMinutes = estimatedTotalMinutes;
  } else {
    updateData.estimatedTotalMinutes =
      calculateEstimatedTotalMinutes(nextSteps);
  }

  const updatedTemplate = await RoadmapTemplate.findByIdAndUpdate(
    templateId,
    updateData,
    { new: true, runValidators: true },
  )
    .populate("createdBy", "username email Fname Lname")
    .select("-__v");

  return updatedTemplate;
};

export const deleteRoadmapTemplateCore = async ({ templateId }) => {
  const assignedCount = await UserRoadmap.countDocuments({
    template: templateId,
  });

  if (assignedCount > 0) {
    throw createServiceError(
      400,
      `Cannot delete this template. It has been assigned to ${assignedCount} user(s).`,
    );
  }

  const deletedTemplate = await RoadmapTemplate.findByIdAndDelete(templateId);

  if (!deletedTemplate) {
    throw createServiceError(404, "Roadmap template not found.");
  }

  return deletedTemplate;
};

export const publishRoadmapTemplateCore = async ({ templateId }) => {
  const template =
    await RoadmapTemplate.findById(templateId).select("_id isActive steps");

  if (!template) {
    throw createServiceError(404, "Roadmap template not found.");
  }

  if (!template.steps || template.steps.length === 0) {
    throw createServiceError(400, "Cannot publish a roadmap without steps.");
  }

  const publishedTemplate = await RoadmapTemplate.findByIdAndUpdate(
    templateId,
    { isActive: true },
    { new: true },
  )
    .populate("createdBy", "username email Fname Lname")
    .select("-__v");

  return publishedTemplate;
};

export const unpublishRoadmapTemplateCore = async ({ templateId }) => {
  const unpublishedTemplate = await RoadmapTemplate.findByIdAndUpdate(
    templateId,
    { isActive: false },
    { new: true },
  )
    .populate("createdBy", "username email Fname Lname")
    .select("-__v");

  if (!unpublishedTemplate) {
    throw createServiceError(404, "Roadmap template not found.");
  }

  return unpublishedTemplate;
};

export const addStepToTemplate = async (req, res) => {
  const { templateId } = req.params;
  const {
    stepKey,
    title,
    description,
    course,
    order,
    estimatedMinutes,
    required,
  } = req.body;

  try {
    const template = await RoadmapTemplate.findById(templateId);

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    const newStep = {
      stepKey,
      title,
      description,
      course,
      order,
      estimatedMinutes: estimatedMinutes || 0,
      required: required !== false,
    };

    template.steps.push(newStep);
    await template.save();

    return res.status(200).json({
      success: true,
      message: "Step added successfully.",
      data: template,
    });
  } catch (error) {
    logger.error("Add step error", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add step.",
      error: error.message,
    });
  }
};

export const removeStepFromTemplate = async (req, res) => {
  const { templateId, stepKey } = req.params;

  try {
    const template = await RoadmapTemplate.findById(templateId);

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    template.steps = template.steps.filter((step) => step.stepKey !== stepKey);
    await template.save();

    return res.status(200).json({
      success: true,
      message: "Step removed successfully.",
      data: template,
    });
  } catch (error) {
    logger.error("Remove step error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove step.",
      error: error.message,
    });
  }
};

export default {
  createRoadmapTemplate,
  getRoadmapTemplate,
  getRoadmapTemplateBySlug,
  getMyRoadmapTemplateBySlug,
  getRoadmapTopic,
  getAllRoadmapTemplates,
  searchRoadmapsAndTopics,
  updateRoadmapTemplate,
  deleteRoadmapTemplate,
  publishRoadmapTemplate,
  unpublishRoadmapTemplate,
  updateRoadmapTemplateCore,
  deleteRoadmapTemplateCore,
  publishRoadmapTemplateCore,
  unpublishRoadmapTemplateCore,
  addStepToTemplate,
  removeStepFromTemplate,
};
