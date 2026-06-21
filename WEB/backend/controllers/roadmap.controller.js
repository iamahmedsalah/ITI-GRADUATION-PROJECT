import {
  assignRoadmapToUserCore,
  deleteUserRoadmapCore,
  getRoadmapProgressCore,
  getUserRoadmapsCore,
  updateStepProgressCore,
} from "../services/roadmap.service.js";

// ============ USER ROADMAP CONTROLLERS ============

export const assignRoadmapToUser = async (req, res, next) => {
  const userId = req.user._id;
  const { templateId, targetDate, notes } = req.body;

  try {
    const data = await assignRoadmapToUserCore({ userId, templateId, targetDate, notes });
    return res.status(201).json({
      success: true,
      message: "Roadmap assigned successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateStepProgress = async (req, res, next) => {
  const userId = req.user._id;
  const { roadmapId, stepKey } = req.params;
  const { status, score, timeSpentMinutes, attempts, notes } = req.body;

  try {
    const data = await updateStepProgressCore({
      userId,
      roadmapId,
      stepKey,
      payload: { status, score, timeSpentMinutes, attempts, notes },
    });

    return res.status(200).json({
      success: true,
      message: "Step progress updated successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRoadmapProgress = async (req, res, next) => {
  const userId = req.user._id;
  const { roadmapId } = req.params;

  try {
    const data = await getRoadmapProgressCore({ userId, roadmapId });
    return res.status(200).json({
      success: true,
      message: "Roadmap progress retrieved successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserRoadmaps = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const data = await getUserRoadmapsCore({ userId });
    return res.status(200).json({
      success: true,
      message: data.length > 0 ? "Roadmaps retrieved successfully." : "No roadmaps found.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserRoadmap = async (req, res, next) => {
  const userId = req.user._id;
  const { roadmapId } = req.params;

  try {
    const data = await deleteUserRoadmapCore({ userId, roadmapId });
    return res.status(200).json({
      success: true,
      message: "Roadmap deleted successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// ============ ROADMAP TEMPLATE CONTROLLERS (RE-EXPORTS) ============
export {
  addStepToTemplate,
  createRoadmapTemplate,
  deleteRoadmapTemplate,
  getAllRoadmapTemplates,
  getMyRoadmapTemplateBySlug,
  getRoadmapTemplate,
  getRoadmapTemplateBySlug,
  getRoadmapTopic,
  publishRoadmapTemplate,
  removeStepFromTemplate,
  searchRoadmapsAndTopics,
  unpublishRoadmapTemplate,
  updateRoadmapTemplate,
} from "../services/roadmap-template.service.js";
