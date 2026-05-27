import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";

// ============ USER ROADMAP SERVICES ============

export const assignRoadmapToUser = async (req, res) => {
  const userId = req.user._id;
  const { templateId, targetDate, notes } = req.body;

  try {
    const template = await RoadmapTemplate.findById(templateId).select(
      "_id title steps"
    );

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    const existingRoadmap = await UserRoadmap.findOne({
      user: userId,
      template: templateId,
    });

    if (existingRoadmap) {
      return res.status(409).json({
        success: false,
        message: "You have already been assigned this roadmap.",
      });
    }

    const newRoadmap = await UserRoadmap.create({
      user: userId,
      template: templateId,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      notes,
      status: "assigned",
    });

    const stepProgressRecords = template.steps.map((step) => ({
      user: userId,
      roadmap: newRoadmap._id,
      template: templateId,
      stepKey: step.stepKey,
      course: step.course,
      status: "notStarted",
    }));

    await UserRoadmapStepProgress.insertMany(stepProgressRecords);

    const populatedRoadmap = await UserRoadmap.findById(newRoadmap._id)
      .populate("template", "title description")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Roadmap assigned successfully.",
      data: populatedRoadmap,
    });
  } catch (error) {
    console.error("Assign roadmap error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign roadmap.",
      error: error.message,
    });
  }
};

export const updateStepProgress = async (req, res) => {
  const userId = req.user._id;
  const { roadmapId, stepKey } = req.params;
  const { status, score, timeSpentMinutes, attempts, notes } = req.body;

  try {
    const roadmap = await UserRoadmap.findOne({
      _id: roadmapId,
      user: userId,
    }).select("_id template status");

    if (!roadmap) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap not found." });
    }

    if (roadmap.status === "completed" || roadmap.status === "archived") {
      return res.status(400).json({
        success: false,
        message: `Cannot update progress on a ${roadmap.status} roadmap.`,
      });
    }

    const stepProgress = await UserRoadmapStepProgress.findOne({
      user: userId,
      roadmap: roadmapId,
      stepKey,
    });

    if (!stepProgress) {
      return res
        .status(404)
        .json({ success: false, message: "Step progress record not found." });
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (timeSpentMinutes !== undefined)
      updateData.timeSpentMinutes = timeSpentMinutes;
    if (attempts !== undefined) updateData.attempts = attempts;
    if (notes !== undefined) updateData.notes = notes;

    if (status === "inProgress" && !stepProgress.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === "completed" && !stepProgress.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedProgress = await UserRoadmapStepProgress.findByIdAndUpdate(
      stepProgress._id,
      updateData,
      { new: true, runValidators: true }
    );

    await updateRoadmapProgress(roadmapId, userId);

    return res.status(200).json({
      success: true,
      message: "Step progress updated successfully.",
      data: updatedProgress,
    });
  } catch (error) {
    console.error("Update step progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update step progress.",
      error: error.message,
    });
  }
};

const updateRoadmapProgress = async (roadmapId, userId) => {
  try {
    const allSteps = await UserRoadmapStepProgress.find({
      roadmap: roadmapId,
      user: userId,
    }).select("status");

    if (allSteps.length === 0) return;

    const completedCount = allSteps.filter(
      (s) => s.status === "completed"
    ).length;
    const progressPercent = Math.round(
      (completedCount / allSteps.length) * 100
    );

    const updateData = { progressPercent };

    if (progressPercent === 100) {
      updateData.status = "completed";
      updateData.completedAt = new Date();
    } else if (progressPercent > 0) {
      updateData.status = "inProgress";
    }

    await UserRoadmap.findByIdAndUpdate(roadmapId, updateData);
  } catch (error) {
    console.error("Error updating roadmap progress:", error);
  }
};

export const getRoadmapProgress = async (req, res) => {
  const userId = req.user._id;
  const { roadmapId } = req.params;

  try {
    const roadmap = await UserRoadmap.findOne({
      _id: roadmapId,
      user: userId,
    })
      .populate("template", "title description steps")
      .select("-__v");

    if (!roadmap) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap not found." });
    }

    const stepProgress = await UserRoadmapStepProgress.find({
      roadmap: roadmapId,
      user: userId,
    }).select("-__v");

    return res.status(200).json({
      success: true,
      data: {
        roadmap,
        stepProgress,
      },
    });
  } catch (error) {
    console.error("Get roadmap progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap progress.",
      error: error.message,
    });
  }
};

export const getUserRoadmaps = async (req, res) => {
  const userId = req.user._id;

  try {
    const roadmaps = await UserRoadmap.find({ user: userId })
      .populate("template", "title description")
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: roadmaps,
    });
  } catch (error) {
    console.error("Get user roadmaps error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmaps.",
      error: error.message,
    });
  }
};

// ============ ROADMAP TEMPLATE SERVICES ============

export const createRoadmapTemplate = async (req, res) => {
  const userId = req.user._id;
  const {
    title,
    slug,
    goal,
    description,
    targetRole,
    targetLevel,
    tags,
    steps,
    estimatedTotalMinutes,
    source,
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

    const newTemplate = await RoadmapTemplate.create({
      title,
      slug,
      goal,
      description,
      targetRole: targetRole || "student",
      targetLevel: targetLevel || "beginner",
      tags: tags || [],
      steps: steps || [],
      estimatedTotalMinutes: estimatedTotalMinutes || 0,
      source: source || "manual",
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
    console.error("Create roadmap template error:", error);

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
    const template = await RoadmapTemplate.findById(templateId)
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get roadmap template error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap template.",
      error: error.message,
    });
  }
};

export const getAllRoadmapTemplates = async (req, res) => {
  const { targetLevel, targetRole, isActive, page = 1, limit = 10 } = req.query;

  try {
    const query = {};

    if (targetLevel) query.targetLevel = targetLevel;
    if (targetRole) query.targetRole = targetRole;
    if (isActive !== undefined)
      query.isActive = isActive === "true" ? true : false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const templates = await RoadmapTemplate.find(query)
      .populate("createdBy", "username email Fname Lname")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RoadmapTemplate.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: templates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all roadmap templates error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap templates.",
      error: error.message,
    });
  }
};

export const updateRoadmapTemplate = async (req, res) => {
  const { templateId } = req.params;
  const {
    title,
    goal,
    description,
    targetRole,
    targetLevel,
    tags,
    steps,
    estimatedTotalMinutes,
    isActive,
  } = req.body;

  try {
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (goal !== undefined) updateData.goal = goal;
    if (description !== undefined) updateData.description = description;
    if (targetRole !== undefined) updateData.targetRole = targetRole;
    if (targetLevel !== undefined) updateData.targetLevel = targetLevel;
    if (tags !== undefined) updateData.tags = tags;
    if (steps !== undefined) updateData.steps = steps;
    if (estimatedTotalMinutes !== undefined)
      updateData.estimatedTotalMinutes = estimatedTotalMinutes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedTemplate = await RoadmapTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!updatedTemplate) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template updated successfully.",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Update roadmap template error:", error);

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
    const assignedCount = await UserRoadmap.countDocuments({
      template: templateId,
    });

    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this template. It has been assigned to ${assignedCount} user(s).`,
      });
    }

    const deletedTemplate = await RoadmapTemplate.findByIdAndDelete(templateId);

    if (!deletedTemplate) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template deleted successfully.",
      data: deletedTemplate,
    });
  } catch (error) {
    console.error("Delete roadmap template error:", error);
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
    const template = await RoadmapTemplate.findById(templateId).select(
      "_id isActive steps"
    );

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    if (!template.steps || template.steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish a roadmap without steps.",
      });
    }

    const publishedTemplate = await RoadmapTemplate.findByIdAndUpdate(
      templateId,
      { isActive: true },
      { new: true }
    )
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    return res.status(200).json({
      success: true,
      message: "Roadmap template published successfully.",
      data: publishedTemplate,
    });
  } catch (error) {
    console.error("Publish roadmap template error:", error);
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
    const unpublishedTemplate = await RoadmapTemplate.findByIdAndUpdate(
      templateId,
      { isActive: false },
      { new: true }
    )
      .populate("createdBy", "username email Fname Lname")
      .select("-__v");

    if (!unpublishedTemplate) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Roadmap template unpublished successfully.",
      data: unpublishedTemplate,
    });
  } catch (error) {
    console.error("Unpublish roadmap template error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unpublish roadmap template.",
      error: error.message,
    });
  }
};

export const addStepToTemplate = async (req, res) => {
  const { templateId } = req.params;
  const { stepKey, title, description, course, order, estimatedMinutes, required } = req.body;

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
    console.error("Add step error:", error);

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
    console.error("Remove step error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove step.",
      error: error.message,
    });
  }
};
  const userId = req.user._id;
  const { templateId, targetDate, notes } = req.body;

  try {
    const template = await RoadmapTemplate.findById(templateId).select(
      "_id title steps"
    );

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap template not found." });
    }

    const existingRoadmap = await UserRoadmap.findOne({
      user: userId,
      template: templateId,
    });

    if (existingRoadmap) {
      return res.status(409).json({
        success: false,
        message: "You have already been assigned this roadmap.",
      });
    }

    const newRoadmap = await UserRoadmap.create({
      user: userId,
      template: templateId,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      notes,
      status: "assigned",
    });

    const stepProgressRecords = template.steps.map((step) => ({
      user: userId,
      roadmap: newRoadmap._id,
      template: templateId,
      stepKey: step.stepKey,
      course: step.course,
      status: "notStarted",
    }));

    await UserRoadmapStepProgress.insertMany(stepProgressRecords);

    const populatedRoadmap = await UserRoadmap.findById(newRoadmap._id)
      .populate("template", "title description")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Roadmap assigned successfully.",
      data: populatedRoadmap,
    });
  } catch (error) {
    console.error("Assign roadmap error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign roadmap.",
      error: error.message,
    });
  }
};

export const updateStepProgress = async (req, res) => {
  const userId = req.user._id;
  const { roadmapId, stepKey } = req.params;
  const { status, score, timeSpentMinutes, attempts, notes } = req.body;

  try {
    const roadmap = await UserRoadmap.findOne({
      _id: roadmapId,
      user: userId,
    }).select("_id template status");

    if (!roadmap) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap not found." });
    }

    if (roadmap.status === "completed" || roadmap.status === "archived") {
      return res.status(400).json({
        success: false,
        message: `Cannot update progress on a ${roadmap.status} roadmap.`,
      });
    }

    const stepProgress = await UserRoadmapStepProgress.findOne({
      user: userId,
      roadmap: roadmapId,
      stepKey,
    });

    if (!stepProgress) {
      return res
        .status(404)
        .json({ success: false, message: "Step progress record not found." });
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (timeSpentMinutes !== undefined)
      updateData.timeSpentMinutes = timeSpentMinutes;
    if (attempts !== undefined) updateData.attempts = attempts;
    if (notes !== undefined) updateData.notes = notes;

    if (status === "inProgress" && !stepProgress.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === "completed" && !stepProgress.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedProgress = await UserRoadmapStepProgress.findByIdAndUpdate(
      stepProgress._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Calculate and update roadmap progress
    await updateRoadmapProgress(roadmapId, userId);

    return res.status(200).json({
      success: true,
      message: "Step progress updated successfully.",
      data: updatedProgress,
    });
  } catch (error) {
    console.error("Update step progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update step progress.",
      error: error.message,
    });
  }
};

const updateRoadmapProgress = async (roadmapId, userId) => {
  try {
    const allSteps = await UserRoadmapStepProgress.find({
      roadmap: roadmapId,
      user: userId,
    }).select("status");

    if (allSteps.length === 0) return;

    const completedCount = allSteps.filter(
      (s) => s.status === "completed"
    ).length;
    const progressPercent = Math.round(
      (completedCount / allSteps.length) * 100
    );

    const updateData = { progressPercent };

    if (progressPercent === 100) {
      updateData.status = "completed";
      updateData.completedAt = new Date();
    } else if (progressPercent > 0) {
      updateData.status = "inProgress";
      if (!this.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    await UserRoadmap.findByIdAndUpdate(roadmapId, updateData);
  } catch (error) {
    console.error("Error updating roadmap progress:", error);
  }
};

export const getRoadmapProgress = async (req, res) => {
  const userId = req.user._id;
  const { roadmapId } = req.params;

  try {
    const roadmap = await UserRoadmap.findOne({
      _id: roadmapId,
      user: userId,
    })
      .populate("template", "title description steps")
      .select("-__v");

    if (!roadmap) {
      return res
        .status(404)
        .json({ success: false, message: "Roadmap not found." });
    }

    const stepProgress = await UserRoadmapStepProgress.find({
      roadmap: roadmapId,
      user: userId,
    }).select("-__v");

    return res.status(200).json({
      success: true,
      data: {
        roadmap,
        stepProgress,
      },
    });
  } catch (error) {
    console.error("Get roadmap progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmap progress.",
      error: error.message,
    });
  }
};

export const getUserRoadmaps = async (req, res) => {
  const userId = req.user._id;

  try {
    const roadmaps = await UserRoadmap.find({ user: userId })
      .populate("template", "title description")
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: roadmaps,
    });
  } catch (error) {
    console.error("Get user roadmaps error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roadmaps.",
      error: error.message,
    });
  }
};
