import { z } from "zod";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";

const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));

const buildFieldErrorResponse = (field, message, topMessage = "Validation failed.") => ({
  success: false,
  message: topMessage,
  errors: [{ field, message }],
});

const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body ?? {},
    params: req.params ?? {},
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatZodErrors(result.error.issues),
    });
  }

  req.body = result.data.body;
  req.params = result.data.params;
  return next();
};

const assignRoadmapSchema = z.object({
  body: z.object({
    templateId: z
      .string({ error: "Roadmap template ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format."),
    targetDate: z
      .string({ error: "Target date must be a valid ISO string." })
      .datetime()
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters.")
      .optional(),
  }),
  params: z.object({}).passthrough(),
});

const updateStepProgressSchema = z.object({
  body: z.object({
    status: z
      .enum(["notStarted", "inProgress", "completed", "skipped"], {
        error: "Status must be one of: notStarted, inProgress, completed, skipped",
      })
      .optional(),
    score: z
      .number({ error: "Score must be a number." })
      .min(0, "Score must be at least 0")
      .max(100, "Score must be at most 100")
      .optional(),
    timeSpentMinutes: z
      .number({ error: "Time spent must be a number." })
      .min(0, "Time spent cannot be negative")
      .optional(),
    attempts: z
      .number({ error: "Attempts must be a number." })
      .min(0, "Attempts cannot be negative")
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters.")
      .optional(),
  }),
  params: z.object({
    roadmapId: z
      .string({ error: "Roadmap ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid roadmap ID format."),
    stepKey: z
      .string({ error: "Step key is required." })
      .trim()
      .min(1, "Step key cannot be empty"),
  }),
});

export const assignRoadmapValidation = validateRequest(assignRoadmapSchema);

export const updateStepProgressValidation = validateRequest(
  updateStepProgressSchema
);

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

const roadmapStepSchema = z.object({
  stepKey: z
    .string({ error: "Step key is required." })
    .trim()
    .min(1, "Step key cannot be empty")
    .max(50, "Step key must be at most 50 characters"),
  title: z
    .string({ error: "Step title is required." })
    .trim()
    .min(3, "Step title must be at least 3 characters")
    .max(120, "Step title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Step description must be at most 1000 characters")
    .optional(),
  course: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format.")
    .optional(),
  resources: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .max(120, "Resource title must be at most 120 characters")
          .optional(),
        url: z.string().url("Invalid resource URL").optional(),
      })
    )
    .optional(),
  order: z
    .number({ error: "Step order must be a number." })
    .min(0, "Step order cannot be negative"),
  estimatedMinutes: z
    .number({ error: "Estimated minutes must be a number." })
    .min(0, "Estimated minutes cannot be negative")
    .optional(),
  required: z.boolean().optional(),
  dependsOn: z.array(z.string().trim()).optional(),
});

const createRoadmapTemplateSchema = z.object({
  body: z.object({
    title: z
      .string({ error: "Roadmap title is required." })
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title must be at most 150 characters"),
    slug: z
      .string({ error: "Roadmap slug is required." })
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
      .min(3, "Slug must be at least 3 characters")
      .max(100, "Slug must be at most 100 characters"),
    goal: z
      .string({ error: "Roadmap goal is required." })
      .trim()
      .min(10, "Goal must be at least 10 characters")
      .max(300, "Goal must be at most 300 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    targetRole: z
      .enum(["student", "instructor", "admin", "jobSeeker", "careerSwitcher"], {
        error: "Invalid target role.",
      })
      .optional(),
    targetLevel: z
      .enum(["beginner", "intermediate", "advanced"], {
        error: "Invalid target level.",
      })
      .optional(),
    templateType: z
      .enum(["roleBased", "skillBased"], {
        error: "Invalid roadmap type.",
      })
      .optional(),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    steps: z
      .array(roadmapStepSchema)
      .min(1, "Roadmap must contain at least one step")
      .optional(),
    estimatedTotalMinutes: z
      .number({ error: "Estimated total minutes must be a number." })
      .min(0, "Estimated total minutes cannot be negative")
      .optional(),
    source: z
      .enum(["admin", "ai", "manual"], { error: "Invalid source." })
      .optional(),
    contentFormat: z
      .enum(["json", "markdown"], { error: "contentFormat must be either json or markdown." })
      .optional(),
    contentMarkdown: z
      .string()
      .trim()
      .max(50000, "Markdown content must be at most 50000 characters")
      .optional(),
  }),
  params: z.object({}).passthrough(),
}).superRefine((payload, ctx) => {
  const { contentFormat, contentMarkdown, steps } = payload.body;
  const hasSteps = Array.isArray(steps) && steps.length > 0;
  const hasMarkdown = typeof contentMarkdown === "string" && contentMarkdown.trim().length > 0;

  if (contentFormat === "markdown" && !hasMarkdown) {
    ctx.addIssue({
      code: "custom",
      path: ["body", "contentMarkdown"],
      message: "Markdown content is required when content format is set to markdown.",
    });
  }

  if (!hasSteps && !hasMarkdown) {
    ctx.addIssue({
      code: "custom",
      path: ["body", "steps"],
      message: "Provide at least one step or markdown content.",
    });
  }
});

const updateRoadmapTemplateSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title must be at most 150 characters")
      .optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
      .min(3, "Slug must be at least 3 characters")
      .max(100, "Slug must be at most 100 characters")
      .optional(),
    goal: z
      .string()
      .trim()
      .min(10, "Goal must be at least 10 characters")
      .max(300, "Goal must be at most 300 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    targetRole: z
      .enum(["student", "instructor", "admin", "jobSeeker", "careerSwitcher"])
      .optional(),
    targetLevel: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),
    templateType: z
      .enum(["roleBased", "skillBased"])
      .optional(),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    steps: z.array(roadmapStepSchema).optional(),
    estimatedTotalMinutes: z
      .number()
      .min(0, "Estimated total minutes cannot be negative")
      .optional(),
    isActive: z.boolean().optional(),
    contentFormat: z
      .enum(["json", "markdown"])
      .optional(),
    contentMarkdown: z
      .string()
      .trim()
      .max(50000, "Markdown content must be at most 50000 characters")
      .optional(),
  }),
  params: z.object({
    templateId: z
      .string({ error: "Template ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format."),
  }),
});

const publishTemplateSchema = z.object({
  body: z.object({}),
  params: z.object({
    templateId: z
      .string({ error: "Template ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format."),
  }),
});

export const createRoadmapTemplateValidation = validateRequest(
  createRoadmapTemplateSchema
);

export const updateRoadmapTemplateValidation = validateRequest(
  updateRoadmapTemplateSchema
);

export const publishTemplateValidation = validateRequest(publishTemplateSchema);

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
