import Course from "../../models/course/courseModel.js";
import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import User from "../../models/user/userAccountModel.js";
import UserCourseProgress from "../../models/user/userCourseProgressModel.js";
import { resolveCourseImageUrls } from "../../config/cloudinary.js";
import { normalizePagination } from "../../helpers/pagination.js";
import { escapeRegex } from "../../helpers/text.js";
import { logAdminAction, parseBooleanQuery } from "./admin-shared.js";

export const createCourseByAdmin = async (req, res) => {
  const adminId = req.user._id;

  try {
    const courseData = {
      ...req.body,
      deletedAt: null,
    };

    await resolveCourseImageUrls(courseData, { slug: courseData.slug });

    if (courseData.slug) {
      const existingBySlug = await Course.findOne({
        slug: courseData.slug,
      }).select("_id");
      if (existingBySlug) {
        return res.status(409).json({
          success: false,
          message: "This slug is already used by another course.",
        });
      }
    }

    if (courseData.instructor) {
      const instructor = await User.findOne({
        _id: courseData.instructor,
        role: { $in: ["instructor", "admin"] },
      }).select("_id");

      if (!instructor) {
        return res.status(400).json({
          success: false,
          message: "Instructor not found or is not an instructor or admin.",
        });
      }
    }

    if (courseData.roadmapTemplate) {
      const roadmapTemplate = await RoadmapTemplate.findById(
        courseData.roadmapTemplate,
      ).select("_id");
      if (!roadmapTemplate) {
        return res.status(400).json({
          success: false,
          message: "Roadmap template not found.",
        });
      }
    }

    const course = await Course.create(courseData);

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.create",
        targetType: "course",
        targetId: course._id,
        metadata: {
          title: course.title,
          slug: course.slug,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin create course error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A course with that ${duplicatedField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create course.",
      error: error.message,
    });
  }
};

export const getAdminCourses = async (req, res) => {
  const { q, level, isPublished, isFeatured, page, limit } = req.query;

  try {
    const { skip, ...pagination } = normalizePagination(page, limit);
    const query = { deletedAt: null };

    if (level) query.level = level;
    if (isPublished !== undefined)
      query.isPublished = parseBooleanQuery(isPublished);
    if (isFeatured !== undefined)
      query.isFeatured = parseBooleanQuery(isFeatured);

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), "i");
      query.$or = [
        { title: safeRegex },
        { description: safeRegex },
        { shortDescription: safeRegex },
        { tags: safeRegex },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "username email role")
        .populate("roadmapTemplate", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message:
        courses.length > 0
          ? "Courses retrieved successfully."
          : "No courses found.",
      data: courses,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        pages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    console.error("Admin get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses.",
      error: error.message,
    });
  }
};

export const getAdminCourseById = async (req, res) => {
  const { courseId } = req.params;

  try {
    const [course, enrollments] = await Promise.all([
      Course.findById(courseId)
        .where({ deletedAt: null })
        .populate("instructor", "username email role")
        .populate("roadmapTemplate", "title slug")
        .lean(),
      UserCourseProgress.countDocuments({ course: courseId }),
    ]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course details retrieved successfully.",
      data: {
        ...course,
        enrollments,
      },
    });
  } catch (error) {
    console.error("Admin get course by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course.",
      error: error.message,
    });
  }
};

export const updateCourseByAdmin = async (req, res) => {
  const { courseId } = req.params;
  const adminId = req.user._id;

  try {
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    if (req.body.slug && req.body.slug !== course.slug) {
      const existing = await Course.findOne({
        slug: req.body.slug,
        _id: { $ne: courseId },
      }).select("_id");

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This slug is already used by another course.",
        });
      }
    }

    // Validate course instructor reference
    if (req.body.instructor !== undefined) {
      if (req.body.instructor) {
        const instructor = await User.findOne({
          _id: req.body.instructor,
          role: { $in: ["instructor", "admin"] },
        }).select("_id");

        if (!instructor) {
          return res.status(400).json({
            success: false,
            message: "Instructor not found or is not an instructor or admin.",
          });
        }
      }
    }

    // Validate roadmapTemplate reference
    if (req.body.roadmapTemplate !== undefined) {
      if (req.body.roadmapTemplate) {
        const roadmapTemplate = await RoadmapTemplate.findById(
          req.body.roadmapTemplate,
        ).select("_id");

        if (!roadmapTemplate) {
          return res.status(400).json({
            success: false,
            message: "Roadmap template not found.",
          });
        }
      }
    }

    const updatePayload = { ...req.body };
    await resolveCourseImageUrls(updatePayload, {
      slug: updatePayload.slug || course.slug,
      courseId: course._id,
    });

    const updatableFields = [
      "title",
      "slug",
      "description",
      "shortDescription",
      "level",
      "language",
      "tags",
      "category",
      "thumbnailUrl",
      "bannerUrl",
      "durationMinutes",
      "sections",
      "prerequisites",
      "learningOutcomes",
      "isPublished",
      "isFeatured",
      "instructor",
      "roadmapTemplate",
    ];

    const before = {
      title: course.title,
      slug: course.slug,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      level: course.level,
    };

    for (const field of updatableFields) {
      if (updatePayload[field] !== undefined) {
        course[field] = updatePayload[field];
      }
    }

    await course.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.update",
        targetType: "course",
        targetId: course._id,
        metadata: {
          before,
          after: {
            title: course.title,
            slug: course.slug,
            isPublished: course.isPublished,
            isFeatured: course.isFeatured,
            level: course.level,
          },
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin update course error:", error);

    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `A course with that ${duplicatedField} already exists.`,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update course.",
      error: error.message,
    });
  }
};

export const deleteCourseByAdmin = async (req, res) => {
  const { courseId } = req.params;
  const adminId = req.user._id;

  try {
    const enrollmentsCount = await UserCourseProgress.countDocuments({
      course: courseId,
    });

    if (enrollmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this course. It has ${enrollmentsCount} enrollment(s).`,
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Soft delete: set deletedAt instead of hard delete
    course.deletedAt = new Date();
    await course.save();

    try {
      await logAdminAction({
        req,
        adminId,
        action: "admin.course.delete",
        targetType: "course",
        targetId: course._id,
        metadata: {
          title: course.title,
          slug: course.slug,
        },
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Admin delete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course.",
      error: error.message,
    });
  }
};
