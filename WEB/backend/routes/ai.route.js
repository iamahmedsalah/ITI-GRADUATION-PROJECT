import express from "express";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import { validateBody } from "../middleware/validate.js";
import { aiRecommendationLimiter } from "../utils/rateLimiter.js";
import {
  createChatConversationSchema,
  explainTopicSchema,
  roadmapDraftSchema,
  saveAiRoadmapSchema,
  sendChatMessageSchema,
  updateChatConversationSchema,
  userRoadmapPromptSchema,
} from "../validation/ai.schemas.js";
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
  updateUserAiRoadmapVisibility,
} from "../controllers/ai.controller.js";

const router = express.Router();

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

router.put(
  "/roadmaps/:templateId/visibility",
  authorizeRoles("student"),
  aiRecommendationLimiter,
  updateUserAiRoadmapVisibility,
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
