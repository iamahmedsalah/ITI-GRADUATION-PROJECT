import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";

const buildFieldErrorResponse = (field, message, topMessage = "Validation failed.") => ({
  success: false,
  message: topMessage,
  errors: [{ field, message }],
});

export const validateRoadmapExists = async (req, res, next) => {
  const { roadmapId } = req.params;

  try {
    const roadmap = await UserRoadmap.findById(roadmapId)
      .select("_id user template")
      .lean();

    if (!roadmap) {
      return res.status(404).json(
        buildFieldErrorResponse(
          "roadmapId",
          "No roadmap exists with this ID.",
          "Roadmap not found."
        )
      );
    }

    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        buildFieldErrorResponse(
          "roadmapId",
          "You do not have permission to access this roadmap.",
          "Access denied."
        )
      );
    }

    req.roadmap = roadmap;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating roadmap.",
      error: error.message,
    });
  }
};

export const validateTemplateExists = async (req, res, next) => {
  const { templateId } = req.body;

  try {
    const template = await RoadmapTemplate.findOne({ _id: templateId, isActive: true })
      .select("_id steps isActive")
      .lean();

    if (!template) {
      return res.status(404).json(
        buildFieldErrorResponse(
          "templateId",
          "No active roadmap template exists with this ID.",
          "Roadmap template not found."
        )
      );
    }

    req.template = template;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating template.",
      error: error.message,
    });
  }
};

// ============ ROADMAP TEMPLATE VALIDATORS ============

export const validateTemplateExistsInParams = async (req, res, next) => {
  const templateId = req.params.templateId;

  try {
    const template = await RoadmapTemplate.findById(templateId)
      .select("_id title steps")
      .lean();

    if (!template) {
      return res.status(404).json(
        buildFieldErrorResponse(
          "templateId",
          "No roadmap template exists with this ID.",
          "Roadmap template not found."
        )
      );
    }

    req.template = template;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating template.",
      error: error.message,
    });
  }
};

export const validateUniqueSlug = async (req, res, next) => {
  const { slug } = req.body;
  const templateId = req.params.templateId;

  if (!slug) return next();

  try {
    const existingTemplate = await RoadmapTemplate.findOne({
      slug,
      _id: { $ne: templateId },
    })
      .select("_id")
      .lean();

    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        message: "Validation failed.",
        errors: [{ field: "slug", message: "Slug is already in use. Please choose another one." }],
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating slug uniqueness.",
      error: error.message,
    });
  }
};
