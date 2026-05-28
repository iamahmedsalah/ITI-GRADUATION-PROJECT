import { z } from "zod";

const objectIdSchema = z
  .string({ error: "A valid ID is required." })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "ID must be a valid 24-character hexadecimal value.");

const imageDataUriSchema = z
  .string()
  .trim()
  .regex(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/,
    "Image must be a valid URL or base64 data URI.",
  );

const imageInputSchema = z.union([
  z.string().trim().url("Image must be a valid URL or base64 data URI."),
  imageDataUriSchema,
  z.null(),
]);

const formatZodErrors = (issues) =>
  issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : "request",
    message: issue.message,
  }));

const validateRequest = (schema) => async (req, res, next) => {
  const result = await schema.safeParseAsync({
    body: req.body ?? {},
    params: req.params ?? {},
    query: req.query ?? {},
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: formatZodErrors(result.error.issues),
    });
  }

  if (req.body) {
    Object.assign(req.body, result.data.body);
  }
  Object.assign(req.params, result.data.params);
  Object.assign(req.query, result.data.query);
  return next();
};

const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ error: "Page must be a number." })
    .int("Page must be a whole number.")
    .min(1, "Page must be at least 1.")
    .max(100000, "Page value is too large.")
    .default(1),
  limit: z.coerce
    .number({ error: "Limit must be a number." })
    .int("Limit must be a whole number.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit cannot be greater than 100.")
    .default(20),
});

const usersListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: paginationQuerySchema.extend({
    q: z.string().trim().max(100).optional(),
    role: z.enum(["student", "instructor", "admin"]).optional(),
    isVerified: z.enum(["true", "false"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

const userIdParamsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    userId: objectIdSchema,
  }),
  query: z.object({}).passthrough(),
});

const updateUserSchema = z
  .object({
    body: z.object({
      role: z.enum(["student", "instructor", "admin"]).optional(),
      isVerified: z.boolean().optional(),
      isActive: z.boolean().optional(),
      deactivationReason: z
        .string()
        .trim()
        .max(500, "Deactivation reason must be at most 500 characters.")
        .optional(),
    }),
    params: z.object({
      userId: objectIdSchema,
    }),
    query: z.object({}).passthrough(),
  })
  .superRefine((payload, ctx) => {
    const { role, isVerified, isActive, deactivationReason } = payload.body;

    if (
      role === undefined &&
      isVerified === undefined &&
      isActive === undefined &&
      deactivationReason === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message:
          "Provide at least one field to update: role, isVerified, isActive, deactivationReason.",
      });
    }
  });

const roadmapsListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: paginationQuerySchema.extend({
    q: z.string().trim().max(100).optional(),
    targetRole: z
      .enum(["student", "instructor", "admin", "jobSeeker", "careerSwitcher"])
      .optional(),
    targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    isActive: z.enum(["true", "false"]).optional(),
  }),
});

const templateIdParamsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    templateId: objectIdSchema,
  }),
  query: z.object({}).passthrough(),
});

const adminRoadmapStepSchema = z.object({
  stepKey: z
    .string({ error: "Step key is required." })
    .trim()
    .min(1, "Step key cannot be empty")
    .max(50, "Step key must be at most 50 characters"),
  title: z
    .string({ error: "Step title is required." })
    .trim()
    .min(3, "Step title must be at least 3 characters")
    .max(120, "Step title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Step description must be at most 1000 characters")
    .optional(),
  course: objectIdSchema.optional(),
  resources: z
    .array(
      z.object({
        title: z
          .string()
          .trim()
          .max(120, "Resource title must be at most 120 characters")
          .optional(),
        url: z.string().url("Invalid resource URL").optional(),
      })
    )
    .optional(),
  order: z
    .number({ error: "Step order must be a number." })
    .min(0, "Step order cannot be negative"),
  estimatedMinutes: z
    .number({ error: "Estimated minutes must be a number." })
    .min(0, "Estimated minutes cannot be negative")
    .optional(),
  required: z.boolean().optional(),
  dependsOn: z.array(z.string().trim()).optional(),
});

const updateRoadmapSchema = z
  .object({
    body: z.object({
      title: z.string().trim().min(3).max(150).optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
        .min(3)
        .max(100)
        .optional(),
      goal: z.string().trim().min(10).max(300).optional(),
      description: z.string().trim().max(2000).optional(),
      targetRole: z
        .enum(["student", "instructor", "admin", "jobSeeker", "careerSwitcher"])
        .optional(),
      targetLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      tags: z.array(z.string().trim().toLowerCase()).optional(),
      steps: z.array(adminRoadmapStepSchema).optional(),
      estimatedTotalMinutes: z
        .number({ error: "Estimated total minutes must be a number." })
        .min(0, "Estimated total minutes cannot be negative")
        .optional(),
      isActive: z.boolean().optional(),
      contentFormat: z.enum(["json", "markdown"]).optional(),
      contentMarkdown: z.string().trim().max(50000).optional(),
    }),
    params: z.object({
      templateId: objectIdSchema,
    }),
    query: z.object({}).passthrough(),
  })
  .superRefine((payload, ctx) => {
    if (Object.keys(payload.body).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Provide at least one field to update.",
      });
    }
  });

const coursesListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: paginationQuerySchema.extend({
    q: z.string().trim().max(100).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    isPublished: z.enum(["true", "false"]).optional(),
    isFeatured: z.enum(["true", "false"]).optional(),
  }),
});

const courseIdParamsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    courseId: objectIdSchema,
  }),
  query: z.object({}).passthrough(),
});

const createCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
      .min(3)
      .max(150),
    description: z.string().trim().min(10).max(5000),
    shortDescription: z.string().trim().max(300).optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    language: z.string().trim().max(10).optional(),
    tags: z.array(z.string().trim().toLowerCase()).optional(),
    category: z.string().trim().max(120).optional(),
    instructor: objectIdSchema.optional(),
    thumbnailUrl: imageInputSchema.optional(),
    bannerUrl: imageInputSchema.optional(),
    durationMinutes: z.number({ error: "Duration must be a number." }).min(0).optional(),
    sections: z.array(z.any()).optional(),
    prerequisites: z.array(z.string().trim()).optional(),
    learningOutcomes: z.array(z.string().trim()).optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    roadmapTemplate: objectIdSchema.optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const updateCourseSchema = z
  .object({
    body: z.object({
      title: z.string().trim().min(3).max(200).optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
        .min(3)
        .max(150)
        .optional(),
      description: z.string().trim().min(10).max(5000).optional(),
      shortDescription: z.string().trim().max(300).optional(),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      category: z.string().trim().max(120).optional(),
      thumbnailUrl: imageInputSchema.optional(),
      bannerUrl: imageInputSchema.optional(),
      isPublished: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      instructor: objectIdSchema.optional(),
      roadmapTemplate: objectIdSchema.optional(),
    }),
    params: z.object({
      courseId: objectIdSchema,
    }),
    query: z.object({}).passthrough(),
  })
  .superRefine((payload, ctx) => {
    if (Object.keys(payload.body).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Provide at least one field to update.",
      });
    }
  });

const adminLogsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: paginationQuerySchema.extend({
    targetType: z.enum(["user", "roadmapTemplate", "course", "system"]).optional(),
    action: z.string().trim().max(100).optional(),
  }),
});

export const adminUsersListValidation = validateRequest(usersListSchema);
export const adminUserIdValidation = validateRequest(userIdParamsSchema);
export const adminUpdateUserValidation = validateRequest(updateUserSchema);
export const adminRoadmapsListValidation = validateRequest(roadmapsListSchema);
export const adminTemplateIdValidation = validateRequest(templateIdParamsSchema);
export const adminUpdateRoadmapValidation = validateRequest(updateRoadmapSchema);
export const adminCoursesListValidation = validateRequest(coursesListSchema);
export const adminCourseIdValidation = validateRequest(courseIdParamsSchema);
export const adminCreateCourseValidation = validateRequest(createCourseSchema);
export const adminUpdateCourseValidation = validateRequest(updateCourseSchema);
export const adminLogsListValidation = validateRequest(adminLogsSchema);
