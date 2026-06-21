import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import logger from "../utils/logger.js";
import {
  createServiceError,
} from "../helpers/roadmap.helpers.js";

const logRoadmapActivity = async (userId, type, roadmapId, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      type,
      roadmap: roadmapId,
      metadata,
    });
  } catch (error) {
    logger.error("Error logging roadmap activity", error);
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
    logger.error("Error updating roadmap progress", error);
  }
};

// ============ USER ROADMAP SERVICE CORES ============

export const assignRoadmapToUserCore = async ({ userId, templateId, targetDate, notes }) => {
  const template = await RoadmapTemplate.findById(templateId).select("_id title steps");

  if (!template) {
    throw createServiceError(404, "Roadmap template not found.");
  }

  const existingRoadmap = await UserRoadmap.findOne({
    user: userId,
    template: templateId,
  });

  if (existingRoadmap) {
    throw createServiceError(409, "You have already been assigned this roadmap.");
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

  return UserRoadmap.findById(newRoadmap._id)
    .populate("template", "title description")
    .select("-__v");
};

export const updateStepProgressCore = async ({ userId, roadmapId, stepKey, payload }) => {
  const { status, score, timeSpentMinutes, attempts, notes } = payload;

  const roadmap = await UserRoadmap.findOne({
    _id: roadmapId,
    user: userId,
  }).select("_id template status");

  if (!roadmap) {
    throw createServiceError(404, "Roadmap not found.");
  }

  if (roadmap.status === "completed" || roadmap.status === "archived") {
    throw createServiceError(400, `Cannot update progress on a ${roadmap.status} roadmap.`);
  }

  const stepProgress = await UserRoadmapStepProgress.findOne({
    user: userId,
    roadmap: roadmapId,
    stepKey,
  });

  if (!stepProgress) {
    throw createServiceError(404, "Step progress record not found.");
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

  return updatedProgress;
};

export const getRoadmapProgressCore = async ({ userId, roadmapId }) => {
  const roadmap = await UserRoadmap.findOne({
    _id: roadmapId,
    user: userId,
  })
    .populate("template", "title description steps")
    .select("-__v");

  if (!roadmap) {
    throw createServiceError(404, "Roadmap not found.");
  }

  const stepProgress = await UserRoadmapStepProgress.find({
    roadmap: roadmapId,
    user: userId,
  }).select("-__v");

  return {
    roadmap,
    stepProgress,
  };
};

export const getUserRoadmapsCore = async ({ userId }) => {
  return UserRoadmap.find({ user: userId })
    .populate("template", "title slug description targetLevel templateType source visibility")
    .select("-__v")
    .sort({ createdAt: -1 });
};

export const deleteUserRoadmapCore = async ({ userId, roadmapId }) => {
  const roadmap = await UserRoadmap.findOne({
    _id: roadmapId,
    user: userId,
  });

  if (!roadmap) {
    throw createServiceError(404, "Roadmap not found.");
  }

  await UserRoadmapStepProgress.deleteMany({
    user: userId,
    roadmap: roadmap._id,
  });
  await UserRoadmap.deleteOne({ _id: roadmap._id });

  return { _id: roadmap._id };
};
