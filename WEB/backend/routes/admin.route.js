import express from "express";
import {
  adminListLimiter,
  adminWriteLimiter,
  adminPublishLimiter,
  loginLimiter,
  forgotPasswordLimiter,
} from "../utils/rateLimiter.js";
import {
  adminUsersListValidation,
  adminUserIdValidation,
  adminUpdateUserValidation,
  adminRoadmapsListValidation,
  adminTemplateIdValidation,
  adminCreateCourseValidation,
  adminUpdateRoadmapValidation,
  adminCoursesListValidation,
  adminCourseIdValidation,
  adminUpdateCourseValidation,
  adminLogsListValidation,
} from "../middleware/adminValidators.js";
import {
  loginValidation,
  verifyEmailValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
} from "../middleware/authValidators.js";
import { protect, authorizeRoles } from "../middleware/protectsRoutes.js";
import { createRoadmapTemplateValidation } from "../middleware/roadmapValidators.js";
import {
  getAdminOverview,
  getAdminUsers,
  getAdminUserById,
  updateUserByAdmin,
  getAdminRoadmaps,
  getAdminRoadmapById,
  updateRoadmapByAdmin,
  deleteRoadmapByAdmin,
  publishRoadmapByAdmin,
  unpublishRoadmapByAdmin,
  getAdminCourses,
  getAdminCourseById,
  updateCourseByAdmin,
  deleteCourseByAdmin,
  getAdminActionLogs,
  createCourseByAdmin,
  adminLogin,
  adminVerifyEmail,
  adminForgetPassword,
  adminResetPassword,
  adminLogout,
  adminCheckAuth,
} from "../services/admin.service.js";
import { createRoadmapTemplate } from "../services/roadmaps.service.js";

const router = express.Router();

// PUBLIC ADMIN AUTH ROUTES
/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Login an admin user
 */
router.post("/auth/login", loginLimiter, loginValidation, adminLogin);
/**
 * @openapi
 * /admin/auth/verify-email:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Verify admin email
 */
router.post("/auth/verify-email", verifyEmailValidation, adminVerifyEmail);
/**
 * @openapi
 * /admin/auth/forgot-password:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Request admin password reset
 */
router.post(
  "/auth/forgot-password",
  forgotPasswordLimiter,
  forgetPasswordValidation,
  adminForgetPassword,
);
/**
 * @openapi
 * /admin/auth/reset-password/{token}:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Reset admin password
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  "/auth/reset-password/:token",
  resetPasswordValidation,
  adminResetPassword,
);

// PROTECTED ADMIN AUTH ROUTES
router.use(protect, authorizeRoles("admin"));

/**
 * @openapi
 * /admin/auth/logout:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Logout admin
 *     security:
 *       - bearerAuth: []
 */
router.post("/auth/logout", adminLogout);
/**
 * @openapi
 * /admin/auth/check-auth:
 *   get:
 *     tags: [Admin Auth]
 *     summary: Check admin authentication
 *     security:
 *       - bearerAuth: []
 */
router.get("/auth/check-auth", adminCheckAuth);

/**
 * @openapi
 * /admin/overview:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin overview dashboard data
 *     security:
 *       - bearerAuth: []
 */
router.get("/overview", adminListLimiter, getAdminOverview);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users for admin
 *     security:
 *       - bearerAuth: []
 */
router.get("/users", adminListLimiter, adminUsersListValidation, getAdminUsers);
/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/users/:userId",
  adminListLimiter,
  adminUserIdValidation,
  getAdminUserById,
);
/**
 * @openapi
 * /admin/users/{userId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  "/users/:userId",
  adminWriteLimiter,
  adminUpdateUserValidation,
  updateUserByAdmin,
);

/**
 * @openapi
 * /admin/roadmaps:
 *   get:
 *     tags: [Admin]
 *     summary: List roadmap templates for admin
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/roadmaps",
  adminListLimiter,
  adminRoadmapsListValidation,
  getAdminRoadmaps,
);
/**
 * @openapi
 * /admin/roadmaps/templates:
 *   post:
 *     tags: [Admin]
 *     summary: Create roadmap template
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/roadmaps/templates",
  adminWriteLimiter,
  createRoadmapTemplateValidation,
  createRoadmapTemplate,
);
/**
 * @openapi
 * /admin/roadmaps/{templateId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get roadmap template by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/roadmaps/:templateId",
  adminListLimiter,
  adminTemplateIdValidation,
  getAdminRoadmapById,
);
/**
 * @openapi
 * /admin/roadmaps/{templateId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update roadmap template by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  "/roadmaps/:templateId",
  adminWriteLimiter,
  adminUpdateRoadmapValidation,
  updateRoadmapByAdmin,
);
/**
 * @openapi
 * /admin/roadmaps/{templateId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete roadmap template by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  "/roadmaps/:templateId",
  adminWriteLimiter,
  adminTemplateIdValidation,
  deleteRoadmapByAdmin,
);
/**
 * @openapi
 * /admin/roadmaps/{templateId}/publish:
 *   post:
 *     tags: [Admin]
 *     summary: Publish roadmap template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  "/roadmaps/:templateId/publish",
  adminPublishLimiter,
  adminTemplateIdValidation,
  publishRoadmapByAdmin,
);
/**
 * @openapi
 * /admin/roadmaps/{templateId}/unpublish:
 *   post:
 *     tags: [Admin]
 *     summary: Unpublish roadmap template
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  "/roadmaps/:templateId/unpublish",
  adminPublishLimiter,
  adminTemplateIdValidation,
  unpublishRoadmapByAdmin,
);

/**
 * @openapi
 * /admin/courses:
 *   get:
 *     tags: [Admin]
 *     summary: List courses for admin
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/courses",
  adminListLimiter,
  adminCoursesListValidation,
  getAdminCourses,
);
/**
 * @openapi
 * /admin/courses:
 *   post:
 *     tags: [Admin]
 *     summary: Create a course as admin
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/courses",
  adminWriteLimiter,
  adminCreateCourseValidation,
  createCourseByAdmin,
);
/**
 * @openapi
 * /admin/courses/{courseId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get course details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/courses/:courseId",
  adminListLimiter,
  adminCourseIdValidation,
  getAdminCourseById,
);
/**
 * @openapi
 * /admin/courses/{courseId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update course by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  "/courses/:courseId",
  adminWriteLimiter,
  adminUpdateCourseValidation,
  updateCourseByAdmin,
);
/**
 * @openapi
 * /admin/courses/{courseId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete course by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete(
  "/courses/:courseId",
  adminWriteLimiter,
  adminCourseIdValidation,
  deleteCourseByAdmin,
);

/**
 * @openapi
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: List admin action logs
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/logs",
  adminListLimiter,
  adminLogsListValidation,
  getAdminActionLogs,
);

export default router;
