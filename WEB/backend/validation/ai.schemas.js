import { z } from "zod";

export const roadmapDraftSchema = z.object({
  goal: z
    .string({ error: "Goal is required." })
    .trim()
    .min(10, "Goal must be at least 10 characters.")
    .max(300, "Goal must be at most 300 characters."),
  targetRole: z
    .enum(["student", "instructor", "admin", "jobSeeker", "careerSwitcher"])
    .optional(),
  targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  templateType: z.enum(["roleBased", "skillBased"]).optional(),
  durationWeeks: z.number().int().min(4).max(12).optional(),
  weeklyStudyHours: z.number().int().min(1).max(30).optional(),
});

export const userRoadmapPromptSchema = z.object({
  prompt: z
    .string({ error: "Prompt is required." })
    .trim()
    .min(10, "Prompt must be at least 10 characters.")
    .max(500, "Prompt must be at most 500 characters."),
  targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  durationWeeks: z.number().int().min(4).max(12).optional(),
  weeklyStudyHours: z.number().int().min(1).max(30).optional(),
});

export const aiResourceSchema = z.object({
  title: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional(),
});

export const aiRoadmapStepSchema = z.object({
  stepKey: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  resources: z.array(aiResourceSchema).max(6).optional(),
  order: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().min(0).max(2400).optional(),
  required: z.boolean().optional(),
  dependsOn: z.array(z.string().trim().max(120)).max(8).optional(),
});

export const saveAiRoadmapSchema = z.object({
  draft: z.object({
    title: z.string().trim().min(3).max(120),
    slug: z.string().trim().max(120).optional(),
    goal: z.string().trim().min(10).max(300),
    description: z.string().trim().max(2000).optional(),
    targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    templateType: z.enum(["roleBased", "skillBased"]).optional(),
    tags: z.array(z.string().trim().max(40)).max(12).optional(),
    estimatedTotalMinutes: z.number().int().min(0).optional(),
    steps: z.array(aiRoadmapStepSchema).min(4).max(12),
  }),
});

export const explainTopicSchema = z.object({
  roadmapTitle: z.string().trim().min(3).max(120),
  roadmapGoal: z.string().trim().max(300).optional(),
  stepTitle: z.string().trim().min(3).max(120),
  stepDescription: z.string().trim().max(1000).optional(),
});

export const chatContextSchema = z
  .object({
    page: z.string().trim().max(120).optional(),
    courseTitle: z.string().trim().max(120).optional(),
    roadmapTitle: z.string().trim().max(120).optional(),
  })
  .partial()
  .optional();

export const createChatConversationSchema = z.object({
  title: z.string().trim().min(1).max(30).optional(),
  context: chatContextSchema,
  message: z.string().trim().min(1).max(2000).optional(),
});

export const sendChatMessageSchema = z.object({
  message: z
    .string({ error: "Message is required." })
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message must be at most 2000 characters."),
  context: chatContextSchema,
});

export const updateChatConversationSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .trim()
    .min(1, "Title is required.")
    .max(30, "Title must be at most 30 characters."),
});
