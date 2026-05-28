import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import Course from "../models/course/courseModel.js";

const logActivity = async (userId, type, courseId, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      type,
      course: courseId,
      metadata,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export const enrollCourse = async (req, res) => {
  const userId = req.user._id;
  const { courseId, roadmapId } = req.body;

  try {
    const course = await Course.findById(courseId)
      .where({ deletedAt: null })
      .select("_id title sections durationMinutes");

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found." });
    }

    const existingEnrollment = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment && existingEnrollment.status !== "abandoned") {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course.",
      });
    }

    const enrollmentData = {
      user: userId,
      course: courseId,
      status: "inProgress",
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    if (roadmapId) {
      enrollmentData.roadmap = roadmapId;
    }

    let enrollment;
    if (existingEnrollment) {
      enrollment = await UserCourseProgress.findByIdAndUpdate(
        existingEnrollment._id,
        {
          $set: {
            status: "inProgress",
            startedAt: new Date(),
            lastAccessedAt: new Date(),
          },
        },
        { new: true },
      );
    } else {
      enrollment = await UserCourseProgress.create(enrollmentData);
    }

    await logActivity(userId, "course_enroll", courseId, {
      fromRoadmap: !!roadmapId,
    });

    const populatedEnrollment = await UserCourseProgress.findById(
      enrollment._id,
    )
      .populate("course", "title description thumbnailUrl")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Enrolled in course successfully.",
      data: populatedEnrollment,
    });
  } catch (error) {
    console.error("Enroll course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to enroll in course.",
      error: error.message,
    });
  }
};

export const updateCourseProgress = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;
  const { lessonId, watchedMinutes, isComplete, notes } = req.body;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course first.",
      });
    }

    const updateData = {
      lastAccessedAt: new Date(),
    };

    if (watchedMinutes !== undefined) {
      updateData.watchedMinutes = Math.max(
        progress.watchedMinutes || 0,
        watchedMinutes,
      );
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (isComplete && lessonId) {
      if (!progress.completedLessonIds.includes(lessonId)) {
        updateData.completedLessonIds = [
          ...progress.completedLessonIds,
          lessonId,
        ];
      }

      updateData.currentLesson = lessonId;

      const course = await Course.findById(courseId)
        .where({ deletedAt: null })
        .select("sections");
      if (course) {
        const totalLessons = course.sections.reduce(
          (sum, section) => sum + (section.lessons?.length || 0),
          0,
        );
        const completedCount = updateData.completedLessonIds.length;
        updateData.progressPercent = Math.round(
          (completedCount / totalLessons) * 100,
        );
      }
    } else if (lessonId) {
      updateData.currentLesson = lessonId;
    }

    const updatedProgress = await UserCourseProgress.findByIdAndUpdate(
      progress._id,
      updateData,
      { new: true, runValidators: true },
    );

    if (isComplete) {
      await logActivity(userId, "lesson_complete", courseId, {
        lessonId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course progress updated successfully.",
      data: updatedProgress,
    });
  } catch (error) {
    console.error("Update course progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course progress.",
      error: error.message,
    });
  }
};

export const completeCourse = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course first.",
      });
    }

    if (progress.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This course is already completed.",
      });
    }

    const completedProgress = await UserCourseProgress.findByIdAndUpdate(
      progress._id,
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          progressPercent: 100,
        },
      },
      { new: true },
    );

    await logActivity(userId, "course_complete", courseId);

    return res.status(200).json({
      success: true,
      message: "Course completed successfully.",
      data: completedProgress,
    });
  } catch (error) {
    console.error("Complete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete course.",
      error: error.message,
    });
  }
};

export const rateCourse = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;
  const { rating, notes } = req.body;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in this course first.",
      });
    }

    const ratedProgress = await UserCourseProgress.findByIdAndUpdate(
      progress._id,
      {
        $set: {
          rating,
          notes: notes || progress.notes,
        },
      },
      { new: true },
    );

    await logActivity(userId, "rating", courseId, {
      rating,
    });

    return res.status(200).json({
      success: true,
      message: "Course rated successfully.",
      data: ratedProgress,
    });
  } catch (error) {
    console.error("Rate course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to rate course.",
      error: error.message,
    });
  }
};

export const getCourseProgress = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    })
      .populate(
        "course",
        "title description sections durationMinutes deletedAt",
      )
      .select("-__v");

    if (!progress || progress.course?.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course or progress not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get course progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course progress.",
      error: error.message,
    });
  }
};

export const getUserCourses = async (req, res) => {
  const userId = req.user._id;
  const { status } = req.query;

  try {
    const query = { user: userId };

    if (
      status &&
      ["notStarted", "inProgress", "completed", "abandoned"].includes(status)
    ) {
      query.status = status;
    }

    const courses = await UserCourseProgress.find(query)
      .populate(
        "course",
        "title description thumbnailUrl durationMinutes deletedAt",
      )
      .select("-__v")
      .sort({ lastAccessedAt: -1 });

    // Filter out deleted courses
    const activeCourses = courses.filter(
      (enrollment) => !enrollment.course?.deletedAt,
    );

    return res.status(200).json({
      success: true,
      data: activeCourses,
    });
  } catch (error) {
    console.error("Get user courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
};

export const abandonCourse = async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  try {
    const progress = await UserCourseProgress.findOne({
      user: userId,
      course: courseId,
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Course enrollment not found.",
      });
    }

    if (progress.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot abandon a completed course.",
      });
    }

    const abandonedProgress = await UserCourseProgress.findByIdAndUpdate(
      progress._id,
      { status: "abandoned" },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Course abandoned successfully.",
      data: abandonedProgress,
    });
  } catch (error) {
    console.error("Abandon course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to abandon course.",
      error: error.message,
    });
  }
};
