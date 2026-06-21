import { z } from "zod";

const ROADMAP_MARKDOWN_MAX_LENGTH = 5000;

export const assignRoadmapSchema = z.object({
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

export const updateStepProgressSchema = z.object({
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

export const roadmapStepSchema = z.object({
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

export const createRoadmapTemplateSchema = z.object({
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
      .max(
        ROADMAP_MARKDOWN_MAX_LENGTH,
        `Markdown content must be at most ${ROADMAP_MARKDOWN_MAX_LENGTH} characters`,
      )
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

export const updateRoadmapTemplateSchema = z.object({
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
      .max(
        ROADMAP_MARKDOWN_MAX_LENGTH,
        `Markdown content must be at most ${ROADMAP_MARKDOWN_MAX_LENGTH} characters`,
      )
      .optional(),
  }),
  params: z.object({
    templateId: z
      .string({ error: "Template ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format."),
  }),
});

export const publishTemplateSchema = z.object({
  body: z.object({}),
  params: z.object({
    templateId: z
      .string({ error: "Template ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid template ID format."),
  }),
});
