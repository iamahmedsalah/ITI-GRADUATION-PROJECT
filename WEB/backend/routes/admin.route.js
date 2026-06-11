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
  adminContactMessagesListValidation,
  adminContactMessageReplyValidation,
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
  getAdminContactMessages,
  replyToContactMessageByAdmin,
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *           example:
 *             identifier: admin@test.com
 *             password: Password@123
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/auth/login", loginLimiter, loginValidation, adminLogin);
/**
 * @openapi
 * /admin/auth/verify-email:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Verify admin email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyEmailRequest'
 *           example:
 *             code: "123456"
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/auth/verify-email", verifyEmailValidation, adminVerifyEmail);
/**
 * @openapi
 * /admin/auth/forgot-password:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Request admin password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: admin@example.com
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           pattern: "^[a-fA-F0-9]{40}$"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             password: NewPassword@123
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateUserRequest'
 *           examples:
 *             promoteInstructor:
 *               summary: Promote and verify user
 *               value:
 *                 role: instructor
 *                 isVerified: true
 *             deactivateUser:
 *               summary: Deactivate user with reason
 *               value:
 *                 isActive: false
 *                 deactivationReason: Policy verify
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: targetRole
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin, jobSeeker, careerSwitcher]
 *       - in: query
 *         name: targetLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [roleBased, skillBased]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
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
 *             templateType: roleBased
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateCourseRequest'
 *           example:
 *             title: React Advanced Patterns
 *             slug: react-advanced-patterns
 *             description: Master advanced React patterns and best practices for production applications
 *             shortDescription: Advanced React patterns for professional developers
 *             level: advanced
 *             category: Web Development
 *             isPublished: true
 *             isFeatured: true
 *             durationMinutes: 180
 *             tags: [react, javascript, advanced]
 *             prerequisites: [React basics, JavaScript ES6+]
 *             learningOutcomes:
 *               - Master advanced React patterns
 *               - Build scalable applications
 *               - Optimize performance
 *             sections:
 *               - sectionKey: hooks-patterns
 *                 title: Advanced Hooks Patterns
 *                 order: 1
 *                 lessons:
 *                   - lessonKey: custom-hooks
 *                     title: Creating Custom Hooks
 *                     durationMinutes: 45
 *                     isPreview: false
 *                     order: 1
 *                   - lessonKey: hook-composition
 *                     title: Hook Composition Patterns
 *                     durationMinutes: 60
 *                     order: 2
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           $ref: '#/components/schemas/ObjectId'
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
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateCourseRequest'
 *           examples:
 *             basicUpdate:
 *               summary: Update title and publish flags
 *               value:
 *                 title: Updated Course Title
 *                 isPublished: true
 *                 isFeatured: true
 *             assignInstructor:
 *               summary: Assign instructor to course
 *               value:
 *                 instructor: 665f4f10b8a4e3d9c8d41a10
 *     responses:
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 *           $ref: '#/components/schemas/ObjectId'
 */
router.delete(
  "/courses/:courseId",
  adminWriteLimiter,
  adminCourseIdValidation,
  deleteCourseByAdmin,
);

/**
 * @openapi
 * /admin/contact-messages:
 *   get:
 *     tags: [Admin]
 *     summary: List contact form messages for admin
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/contact-messages",
  adminListLimiter,
  adminContactMessagesListValidation,
  getAdminContactMessages,
);

/**
 * @openapi
 * /admin/contact-messages/{contactMessageId}/reply:
 *   post:
 *     tags: [Admin]
 *     summary: Reply to a contact form message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactMessageId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reply]
 *             properties:
 *               reply:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 */
router.post(
  "/contact-messages/:contactMessageId/reply",
  adminWriteLimiter,
  adminContactMessageReplyValidation,
  replyToContactMessageByAdmin,
);

/**
 * @openapi
 * /admin/logs:
 *   get:
 *     tags: [Admin]
 *     summary: List admin action logs
 *     security:
 *       - bearerAuth: []
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [user, roadmapTemplate, course, system]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           maxLength: 100
 */
router.get(
  "/logs",
  adminListLimiter,
  adminLogsListValidation,
  getAdminActionLogs,
);

export default router;
