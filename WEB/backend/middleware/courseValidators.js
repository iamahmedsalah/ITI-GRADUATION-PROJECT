import { z } from "zod";
import Course from "../models/course/courseModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";

const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "body",
    message: issue.message,
  }));

const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body ?? {},
    params: req.params ?? {},
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatZodErrors(result.error.issues),
    });
  }

  req.body = result.data.body;
  req.params = result.data.params;
  return next();
};

const enrollCourseSchema = z.object({
  body: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
    roadmapId: z
      .string({ error: "Roadmap ID must be a valid MongoDB ID." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid roadmap ID format.")
      .optional(),
  }),
  params: z.object({}).passthrough(),
});

const updateCourseProgressSchema = z.object({
  body: z.object({
    lessonId: z
      .string({ error: "Lesson ID is required." })
      .trim()
      .min(1, "Lesson ID cannot be empty"),
    watchedMinutes: z
      .number({ error: "Watched minutes must be a number." })
      .min(0, "Watched minutes cannot be negative")
      .optional(),
    isComplete: z
      .boolean({ error: "isComplete must be a boolean." })
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters.")
      .optional(),
  }),
  params: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
  }),
});

const rateCourseSchema = z.object({
  body: z.object({
    rating: z
      .number({ error: "Rating must be a number." })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5"),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be at most 2000 characters.")
      .optional(),
  }),
  params: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
  }),
});

const completeCourseSchema = z.object({
  body: z.object({}),
  params: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
  }),
});

export const enrollCourseValidation = validateRequest(enrollCourseSchema);

export const updateCourseProgressValidation = validateRequest(
  updateCourseProgressSchema
);

export const rateCourseValidation = validateRequest(rateCourseSchema);

export const completeCourseValidation = validateRequest(completeCourseSchema);

export const validateCourseExists = async (req, res, next) => {
  const courseId = req.params.courseId || req.body.courseId;

  try {
    const course = await Course.findById(courseId)
      .select("_id isPublished sections")
      .lean();

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    if (!course.isPublished) {
      return res.status(403).json({
        success: false,
        message: "This course is not published.",
      });
    }

    req.course = course;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating course.",
      error: error.message,
    });
  }
};

export const validateEnrollmentStatus = async (req, res, next) => {
  const userId = req.user._id;
  const courseId = req.params.courseId || req.body.courseId;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    })
      .select("_id status")
      .lean();

    if (progress && progress.status !== "abandoned") {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course.",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking enrollment.",
      error: error.message,
    });
  }
};

export const validateUserEnrollment = async (req, res, next) => {
  const userId = req.user._id;
  const courseId = req.params.courseId;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    })
      .select("_id status")
      .lean();

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course first.",
      });
    }

    req.enrollment = progress;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking enrollment.",
      error: error.message,
    });
  }
};
