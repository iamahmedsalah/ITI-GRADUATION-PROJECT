import express from "express";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import {
  assignRoadmapValidation,
  updateStepProgressValidation,
  validateRoadmapExists,
  validateTemplateExists,
  createRoadmapTemplateValidation,
  updateRoadmapTemplateValidation,
  publishTemplateValidation,
  validateTemplateExistsInParams,
  validateUniqueSlug,
} from "../middleware/roadmapValidators.js";
import {
  assignRoadmapToUser,
  updateStepProgress,
  getRoadmapProgress,
  getUserRoadmaps,
  createRoadmapTemplate,
  getRoadmapTemplate,
  getAllRoadmapTemplates,
  getRoadmapTemplateBySlug,
  getRoadmapTopic,
  searchRoadmapsAndTopics,
  updateRoadmapTemplate,
  deleteRoadmapTemplate,
  publishRoadmapTemplate,
  unpublishRoadmapTemplate,
  addStepToTemplate,
  removeStepFromTemplate,
} from "../services/roadmaps.service.js";

const router = express.Router();

//  ROADMAP TEMPLATES - PUBLIC ROUTES
/**
 * @openapi
 * /roadmaps/search:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Search roadmaps and roadmap topics
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: targetLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: targetRole
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin, jobSeeker, careerSwitcher]
 */
router.get("/search", searchRoadmapsAndTopics);
/**
 * @openapi
 * /roadmaps/templates:
 *   get:
 *     tags: [Roadmaps]
 *     summary: List all roadmap templates
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: targetLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: targetRole
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin, jobSeeker, careerSwitcher]
 */
router.get("/templates", getAllRoadmapTemplates);
/**
 * @openapi
 * /roadmaps/templates/by-slug/{slug}:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get a roadmap template by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/templates/by-slug/:slug", getRoadmapTemplateBySlug);
/**
 * @openapi
 * /roadmaps/templates/{templateId}:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get roadmap template details by ID
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.get("/templates/:templateId", getRoadmapTemplate);
/**
 * @openapi
 * /roadmaps/templates/{templateId}/topics/{stepKey}:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get a roadmap topic by template and step key
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *       - in: path
 *         name: stepKey
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/templates/:templateId/topics/:stepKey", getRoadmapTopic);

// ALL PROTECTED ROUTES BELOW
router.use(protect);

//  ROADMAP TEMPLATES - PROTECTED ROUTES (Admin only)

// POST - Create new roadmap template
/**
 * @openapi
 * /roadmaps/templates:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Create a roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoadmapTemplateRequest'
 *           example:
 *             title: Full Stack Web Development 2024
 *             slug: fullstack-webdev-2024
 *             goal: Become a full-stack web developer
 *             description: Complete roadmap for mastering full-stack development
 *             targetRole: student
 *             targetLevel: beginner
 *             tags: [web, fullstack]
 *             isActive: true
 *             contentFormat: json
 *             estimatedTotalMinutes: 300
 *             steps:
 *               - stepKey: html-css
 *                 title: HTML & CSS Fundamentals
 *                 order: 1
 *                 estimatedMinutes: 60
 *                 required: true
 *               - stepKey: javascript
 *                 title: JavaScript Programming
 *                 order: 2
 *                 estimatedMinutes: 90
 *                 required: true
 *                 dependsOn: [html-css]
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/templates",
  authorizeRoles("admin"),
  createRoadmapTemplateValidation,
  createRoadmapTemplate,
);

// PUT - Update roadmap template
/**
 * @openapi
 * /roadmaps/templates/{templateId}:
 *   put:
 *     tags: [Roadmaps]
 *     summary: Update a roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoadmapTemplateRequest'
 *           example:
 *             title: Updated Roadmap Title
 *             description: Updated description
 *             isActive: true
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  "/templates/:templateId",
  authorizeRoles("admin"),
  updateRoadmapTemplateValidation,
  validateTemplateExistsInParams,
  validateUniqueSlug,
  updateRoadmapTemplate,
);

// DELETE - Delete roadmap template
/**
 * @openapi
 * /roadmaps/templates/{templateId}:
 *   delete:
 *     tags: [Roadmaps]
 *     summary: Delete a roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.delete(
  "/templates/:templateId",
  authorizeRoles("admin"),
  validateTemplateExistsInParams,
  deleteRoadmapTemplate,
);

// POST - Publish roadmap template
/**
 * @openapi
 * /roadmaps/templates/{templateId}/publish:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Publish a roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.post(
  "/templates/:templateId/publish",
  authorizeRoles("admin"),
  publishTemplateValidation,
  validateTemplateExistsInParams,
  publishRoadmapTemplate,
);

// POST - Unpublish roadmap template
/**
 * @openapi
 * /roadmaps/templates/{templateId}/unpublish:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Unpublish a roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.post(
  "/templates/:templateId/unpublish",
  authorizeRoles("admin"),
  publishTemplateValidation,
  validateTemplateExistsInParams,
  unpublishRoadmapTemplate,
);

// POST - Add step to template
/**
 * @openapi
 * /roadmaps/templates/{templateId}/steps:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Add a step to roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoadmapStepInput'
 *           example:
 *             stepKey: api-design
 *             title: API Design Fundamentals
 *             order: 5
 *             estimatedMinutes: 75
 *             required: false
 *             dependsOn: [nodejs]
 */
router.post(
  "/templates/:templateId/steps",
  authorizeRoles("admin"),
  validateTemplateExistsInParams,
  addStepToTemplate,
);

// DELETE - Remove step from template
/**
 * @openapi
 * /roadmaps/templates/{templateId}/steps/{stepKey}:
 *   delete:
 *     tags: [Roadmaps]
 *     summary: Remove a step from roadmap template (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *       - in: path
 *         name: stepKey
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  "/templates/:templateId/steps/:stepKey",
  authorizeRoles("admin"),
  validateTemplateExistsInParams,
  removeStepFromTemplate,
);

//  USER ROADMAPS - PROTECTED ROUTES (Student)
router.use(authorizeRoles("student"));

// POST - Assign a roadmap to authenticated user
/**
 * @openapi
 * /roadmaps/assign:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Assign a roadmap template to authenticated student
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoadmapRequest'
 *           example:
 *             templateId: 665f5019b8a4e3d9c8d41a11
 *             notes: Starting this learning journey
 *             targetDate: 2026-12-31T00:00:00.000Z
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/assign",
  assignRoadmapValidation,
  validateTemplateExists,
  assignRoadmapToUser,
);

// GET - Get all roadmaps for authenticated user
/**
 * @openapi
 * /roadmaps:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get roadmaps for authenticated student
 *     security:
 *       - bearerAuth: []
 */
router.get("/", getUserRoadmaps);

// GET - Get roadmap progress with step details
/**
 * @openapi
 * /roadmaps/{roadmapId}:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get roadmap progress details by roadmap ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.get("/:roadmapId", getRoadmapProgress);

// PUT - Update step progress
/**
 * @openapi
 * /roadmaps/{roadmapId}/steps/{stepKey}/progress:
 *   put:
 *     tags: [Roadmaps]
 *     summary: Update progress for a roadmap step
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *       - in: path
 *         name: stepKey
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoadmapStepProgressRequest'
 *           example:
 *             status: completed
 *             score: 95
 *             timeSpentMinutes: 60
 *             attempts: 1
 *             notes: Completed successfully
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  "/:roadmapId/steps/:stepKey/progress",
  updateStepProgressValidation,
  validateRoadmapExists,
  updateStepProgress,
);

export default router;
