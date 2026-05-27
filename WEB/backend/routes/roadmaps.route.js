import express from "express";
import { protect } from "../middleware/protectsRoutes.js";
import {
  assignRoadmapValidation,
  updateStepProgressValidation,
  validateRoadmapExists,
  validateTemplateExists,
  createRoadmapTemplateValidation,
  updateRoadmapTemplateValidation,
  publishTemplateValidation,
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
  updateRoadmapTemplate,
  deleteRoadmapTemplate,
  publishRoadmapTemplate,
  unpublishRoadmapTemplate,
  addStepToTemplate,
  removeStepFromTemplate,
} from "../services/roadmaps.service.js";

const router = express.Router();

// ============ ROADMAP TEMPLATES - PUBLIC ROUTES ============
router.get("/templates", getAllRoadmapTemplates);
router.get("/templates/:templateId", getRoadmapTemplate);

// ============ ALL PROTECTED ROUTES BELOW ============
router.use(protect);

// ============ ROADMAP TEMPLATES - PROTECTED ROUTES (Admin/Instructor) ============

// POST - Create new roadmap template
router.post("/templates", createRoadmapTemplateValidation, createRoadmapTemplate);

// PUT - Update roadmap template
router.put(
  "/templates/:templateId",
  updateRoadmapTemplateValidation,
  validateUniqueSlug,
  updateRoadmapTemplate
);

// DELETE - Delete roadmap template
router.delete("/templates/:templateId", deleteRoadmapTemplate);

// POST - Publish roadmap template
router.post(
  "/templates/:templateId/publish",
  publishTemplateValidation,
  publishRoadmapTemplate
);

// POST - Unpublish roadmap template
router.post(
  "/templates/:templateId/unpublish",
  publishTemplateValidation,
  unpublishRoadmapTemplate
);

// POST - Add step to template
router.post("/templates/:templateId/steps", addStepToTemplate);

// DELETE - Remove step from template
router.delete("/templates/:templateId/steps/:stepKey", removeStepFromTemplate);

// ============ USER ROADMAPS - PROTECTED ROUTES (Student) ============

// POST - Assign a roadmap to authenticated user
router.post(
  "/assign",
  assignRoadmapValidation,
  validateTemplateExists,
  assignRoadmapToUser
);

// GET - Get all roadmaps for authenticated user
router.get("/", getUserRoadmaps);

// GET - Get roadmap progress with step details
router.get("/:roadmapId", getRoadmapProgress);

// PUT - Update step progress
router.put(
  "/:roadmapId/steps/:stepKey/progress",
  updateStepProgressValidation,
  validateRoadmapExists,
  updateStepProgress
);

export default router;
