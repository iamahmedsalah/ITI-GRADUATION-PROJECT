import express from "express";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
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
router.use(authorizeRoles("student"));

// POST - Enroll in a course
/**
 * @openapi
 * /courses/enroll:
 *   post:
 *     tags: [Courses]
 *     summary: Enroll the authenticated student in a course
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollCourseRequest'
 *           example:
 *             courseId: 665f4f10b8a4e3d9c8d41a10
 *             roadmapId: 665f5019b8a4e3d9c8d41a11
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/enroll",
  enrollCourseValidation,
  validateCourseExists,
  validateEnrollmentStatus,
  enrollCourse,
);

// GET - Get all user's courses (with optional status filter)
/**
 * @openapi
 * /courses:
 *   get:
 *     tags: [Courses]
 *     summary: Get courses for authenticated student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [notStarted, inProgress, completed, abandoned]
 */
router.get("/", getUserCourses);

// GET - Get specific course progress
/**
 * @openapi
 * /courses/{courseId}:
 *   get:
 *     tags: [Courses]
 *     summary: Get progress details for an enrolled course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.get("/:courseId", validateUserEnrollment, getCourseProgress);

// PUT - Update lesson/course progress
/**
 * @openapi
 * /courses/{courseId}/progress:
 *   put:
 *     tags: [Courses]
 *     summary: Update progress for an enrolled course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCourseProgressRequest'
 *           example:
 *             lessonId: lesson-1
 *             watchedMinutes: 30
 *             isComplete: true
 *             notes: Lesson completed
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  "/:courseId/progress",
  updateCourseProgressValidation,
  validateUserEnrollment,
  updateCourseProgress,
);

// POST - Mark course as completed
/**
 * @openapi
 * /courses/{courseId}/complete:
 *   post:
 *     tags: [Courses]
 *     summary: Mark an enrolled course as completed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.post(
  "/:courseId/complete",
  completeCourseValidation,
  validateUserEnrollment,
  completeCourse,
);

// POST - Rate course
/**
 * @openapi
 * /courses/{courseId}/rate:
 *   post:
 *     tags: [Courses]
 *     summary: Submit a rating for an enrolled course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RateCourseRequest'
 *           example:
 *             rating: 5
 *             notes: Excellent course, learned a lot
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/:courseId/rate",
  rateCourseValidation,
  validateUserEnrollment,
  rateCourse,
);

// POST - Abandon course
/**
 * @openapi
 * /courses/{courseId}/abandon:
 *   post:
 *     tags: [Courses]
 *     summary: Abandon an enrolled course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 */
router.post("/:courseId/abandon", validateUserEnrollment, abandonCourse);

export default router;
