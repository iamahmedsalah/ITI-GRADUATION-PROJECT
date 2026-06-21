import Course from "../models/course/courseModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";

const buildFieldErrorResponse = (field, message, topMessage = "Validation failed.") => ({
  success: false,
  message: topMessage,
  errors: [{ field, message }],
});

export const validateCourseExists = async (req, res, next) => {
  const courseId = req.params.courseId || req.body.courseId;

  try {
    const course = await Course.findById(courseId)
      .select("_id isPublished sections")
      .lean();

    if (!course) {
      return res.status(404).json(
        buildFieldErrorResponse(
          "courseId",
          "No course exists with this ID.",
          "Course not found."
        )
      );
    }

    if (!course.isPublished) {
      return res.status(403).json(
        buildFieldErrorResponse(
          "courseId",
          "This course is currently unpublished.",
          "Access denied."
        )
      );
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
      return res.status(409).json(
        buildFieldErrorResponse(
          "courseId",
          "You are already enrolled in this course.",
          "Enrollment conflict."
        )
      );
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
      return res.status(403).json(
        buildFieldErrorResponse(
          "courseId",
          "You need to enroll in this course before updating progress.",
          "Access denied."
        )
      );
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
