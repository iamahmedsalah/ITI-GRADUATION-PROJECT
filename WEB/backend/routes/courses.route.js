import express from "express";
import { protect } from "../middleware/protectsRoutes.js";
import {
  enrollCourseValidation,
  updateCourseProgressValidation,
  rateCourseValidation,
  completeCourseValidation,
  validateCourseExists,
  validateEnrollmentStatus,
  validateUserEnrollment,
} from "../middleware/courseValidators.js";
import {
  enrollCourse,
  updateCourseProgress,
  completeCourse,
  rateCourse,
  getCourseProgress,
  getUserCourses,
  abandonCourse,
} from "../services/courses.service.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST - Enroll in a course
router.post(
  "/enroll",
  enrollCourseValidation,
  validateCourseExists,
  validateEnrollmentStatus,
  enrollCourse
);

// GET - Get all user's courses (with optional status filter)
router.get("/", getUserCourses);

// GET - Get specific course progress
router.get("/:courseId", validateUserEnrollment, getCourseProgress);

// PUT - Update lesson/course progress
router.put(
  "/:courseId/progress",
  updateCourseProgressValidation,
  validateUserEnrollment,
  updateCourseProgress
);

// POST - Mark course as completed
router.post(
  "/:courseId/complete",
  completeCourseValidation,
  validateUserEnrollment,
  completeCourse
);

// POST - Rate course
router.post(
  "/:courseId/rate",
  rateCourseValidation,
  validateUserEnrollment,
  rateCourse
);

// POST - Abandon course
router.post("/:courseId/abandon", validateUserEnrollment, abandonCourse);

export default router;
