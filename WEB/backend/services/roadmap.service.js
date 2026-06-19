import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";


const slugifyStepKey = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "step";

const ensureUniqueStepKeys = (steps = []) => {
  const used = new Map();

  return steps.map((step, index) => {
    const base = slugifyStepKey(
      step.stepKey || step.title || `step-${index + 1}`,
    );
    const count = used.get(base) || 0;
    used.set(base, count + 1);

    return {
      ...step,
      stepKey: count === 0 ? base : `${base}-${count + 1}`,
      order: typeof step.order === "number" ? step.order : index,
      required: step.required !== false,
      estimatedMinutes: Number(step.estimatedMinutes) || 0,
      dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : [],
    };
  });
};

const parseRoadmapMarkdownToSteps = (markdown = "") => {
  const lines = String(markdown || "").split(/\r?\n/);
  const steps = [];
  let currentStep = null;

  const pushCurrentStep = () => {
    if (!currentStep) return;

    currentStep.description = currentStep.description.trim() || undefined;
    steps.push(currentStep);
    currentStep = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (currentStep) currentStep.description += "\n";
      continue;
    }

    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      pushCurrentStep();
      currentStep = {
        stepKey: slugifyStepKey(headingMatch[1]),
        title: headingMatch[1].trim(),
        description: "",
        resources: [],
        order: steps.length,
        required: true,
        estimatedMinutes: 0,
        dependsOn: [],
      };
      continue;
    }

    if (!currentStep) continue;

    const resourceMatch = line.match(
      /^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i,
    );
    if (resourceMatch) {
      currentStep.resources.push({
        title: resourceMatch[1].trim(),
        url: resourceMatch[2].trim(),
      });
      continue;
    }

    currentStep.description += `${line}\n`;
  }

  pushCurrentStep();

  return ensureUniqueStepKeys(steps);
};

const calculateEstimatedTotalMinutes = (steps = []) =>
  steps.reduce(
    (total, step) => total + (Number(step.estimatedMinutes) || 0),
    0,
  );

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createServiceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const publicTemplateFilter = () => ({
  isActive: true,
  $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
});

const logRoadmapActivity = async (userId, type, roadmapId, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      type,
      roadmap: roadmapId,
      metadata,
    });
  } catch (error) {
    console.error("Error logging roadmap activity:", error);
  }
};

// ============ USER ROADMAP SERVICES ============

export const assignRoadmapToUser = async (req, res) => {
  const userId = req.user._id;
  const { templateId, targetDate, notes } = req.body;

  try {
    const template =
      await RoadmapTemplate.findById(templateId).select("_id title steps");

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
    await logRoadmapActivity(userId, "roadmap_start", newRoadmap._id, {
      templateId,
      topicsCount: stepProgressRecords.length,
    });

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
      { new: true, runValidators: true },
    );

    await updateRoadmapProgress(roadmapId, userId);
    if (status === "completed") {
      await logRoadmapActivity(userId, "roadmap_step_complete", roadmapId, {
        stepKey,
        completedSteps: 1,
      });
    } else if (status === "inProgress") {
      await logRoadmapActivity(userId, "roadmap_start", roadmapId, {
        stepKey,
      });
    }

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
      (s) => s.status === "completed",
    ).length;
    const progressPercent = Math.round(
      (completedCount / allSteps.length) * 100,
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
      message: "Roadmap progress retrieved successfully.",
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
      .populate("template", "title slug description targetLevel templateType source visibility")
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message:
        roadmaps.length > 0 ? "Roadmaps retrieved successfully." : "No roadmaps found.",
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

export const deleteUserRoadmap = async (req, res) => {
  const userId = req.user._id;
  const { roadmapId } = req.params;

  try {
    const roadmap = await UserRoadmap.findOne({
      _id: roadmapId,
      user: userId,
    });

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "Roadmap not found.",
      });
    }

    await UserRoadmapStepProgress.deleteMany({
      user: userId,
      roadmap: roadmap._id,
    });
    await UserRoadmap.deleteOne({ _id: roadmap._id });

    return res.status(200).json({
      success: true,
      message: "Roadmap deleted successfully.",
      data: { _id: roadmap._id },
    });
  } catch (error) {
    console.error("Delete user roadmap error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete roadmap.",
      error: error.message,
    });
  }
};
