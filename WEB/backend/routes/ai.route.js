import express from "express";
import { z } from "zod";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import { aiRecommendationLimiter } from "../utils/rateLimiter.js";
import {
  createAiChatConversation,
  deleteAiChatConversation,
  explainAiRoadmapTopic,
  generateAiRoadmapDraft,
  generateUserAiRoadmapDraft,
  getAiFeatureAccess,
  getAiChatMessages,
  getAiRecommendations,
  listAiChatConversations,
  saveUserAiRoadmap,
  sendAiChatMessage,
  updateAiChatConversation,
} from "../services/ai.service.js";

const router = express.Router();

const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatZodErrors(result.error.issues),
    });
  }

  req.body = result.data;
  return next();
};

const roadmapDraftSchema = z.object({
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

const userRoadmapPromptSchema = z.object({
  prompt: z
    .string({ error: "Prompt is required." })
    .trim()
    .min(10, "Prompt must be at least 10 characters.")
    .max(500, "Prompt must be at most 500 characters."),
  targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  durationWeeks: z.number().int().min(4).max(12).optional(),
  weeklyStudyHours: z.number().int().min(1).max(30).optional(),
});

const aiResourceSchema = z.object({
  title: z.string().trim().max(120).optional(),
  url: z.string().trim().url().optional(),
});

const aiRoadmapStepSchema = z.object({
  stepKey: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  resources: z.array(aiResourceSchema).max(6).optional(),
  order: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().min(0).max(2400).optional(),
  required: z.boolean().optional(),
  dependsOn: z.array(z.string().trim().max(120)).max(8).optional(),
});

const saveAiRoadmapSchema = z.object({
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

const explainTopicSchema = z.object({
  roadmapTitle: z.string().trim().min(3).max(120),
  roadmapGoal: z.string().trim().max(300).optional(),
  stepTitle: z.string().trim().min(3).max(120),
  stepDescription: z.string().trim().max(1000).optional(),
});

const chatContextSchema = z
  .object({
    page: z.string().trim().max(120).optional(),
    courseTitle: z.string().trim().max(120).optional(),
    roadmapTitle: z.string().trim().max(120).optional(),
  })
  .partial()
  .optional();

const createChatConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  context: chatContextSchema,
  message: z.string().trim().min(1).max(2000).optional(),
});

const sendChatMessageSchema = z.object({
  message: z
    .string({ error: "Message is required." })
    .trim()
    .min(1, "Message is required.")
    .max(2000, "Message must be at most 2000 characters."),
  context: chatContextSchema,
});

const updateChatConversationSchema = z.object({
  title: z
    .string({ error: "Title is required." })
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be at most 120 characters."),
});

router.use(protect);

/**
 * @openapi
 * /ai/recommendations:
 *   get:
 *     tags: [AI]
 *     summary: Get personalized learning recommendations
 *     description: Returns recommended next roadmap steps, courses, and roadmaps for the authenticated student.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/recommendations",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  getAiRecommendations,
);

router.get(
  "/features/access",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  getAiFeatureAccess,
);

router.get(
  "/chat/conversations",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  listAiChatConversations,
);

router.post(
  "/chat/conversations",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(createChatConversationSchema),
  createAiChatConversation,
);

router.get(
  "/chat/conversations/:conversationId/messages",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  getAiChatMessages,
);

router.post(
  "/chat/conversations/:conversationId/messages",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(sendChatMessageSchema),
  sendAiChatMessage,
);

router.patch(
  "/chat/conversations/:conversationId",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(updateChatConversationSchema),
  updateAiChatConversation,
);

router.delete(
  "/chat/conversations/:conversationId",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  deleteAiChatConversation,
);

router.post(
  "/roadmaps/user-draft",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(userRoadmapPromptSchema),
  generateUserAiRoadmapDraft,
);

router.post(
  "/roadmaps/save",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(saveAiRoadmapSchema),
  saveUserAiRoadmap,
);

router.post(
  "/topics/explain",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  validateBody(explainTopicSchema),
  explainAiRoadmapTopic,
);

/**
 * @openapi
 * /ai/roadmaps/draft:
 *   post:
 *     tags: [AI]
 *     summary: Generate an AI roadmap draft for admin review
 *     description: Creates a markdown/json roadmap draft that admins can review and save as a roadmap template.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [goal]
 *             properties:
 *               goal:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 300
 *               targetRole:
 *                 type: string
 *                 enum: [student, instructor, admin, jobSeeker, careerSwitcher]
 *               targetLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               templateType:
 *                 type: string
 *                 enum: [roleBased, skillBased]
 *               durationWeeks:
 *                 type: integer
 *                 minimum: 4
 *                 maximum: 12
 *               weeklyStudyHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *     responses:
 *       200:
 *         description: Roadmap draft generated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/roadmaps/draft",
  authorizeRoles("admin"),
  aiRecommendationLimiter,
  validateBody(roadmapDraftSchema),
  generateAiRoadmapDraft,
);

export default router;
