import express from "express";
import { z } from "zod";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import { aiRecommendationLimiter } from "../utils/rateLimiter.js";
import {
  generateAiRoadmapDraft,
  getAiRecommendations,
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
