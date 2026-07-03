import express from "express";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import { validateBody } from "../middleware/validate.js";
import { createProAccessRequestSchema } from "../validation/pro-access.schemas.js";
import {
  createProAccessRequest,
  getMyProAccessRequest,
} from "../services/pro-access.service.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/mine", getMyProAccessRequest);
router.post(
  "/requests",
  validateBody(createProAccessRequestSchema),
  createProAccessRequest,
);

export default router;
