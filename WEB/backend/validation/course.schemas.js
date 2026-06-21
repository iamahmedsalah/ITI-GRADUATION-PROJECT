import { z } from "zod";

export const enrollCourseSchema = z.object({
  body: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
    roadmapId: z
      .string({ error: "Roadmap ID must be a string when provided." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Roadmap ID must be a valid 24-character hexadecimal value.")
      .optional(),
  }),
  params: z.object({}).passthrough(),
});

export const updateCourseProgressSchema = z.object({
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

export const rateCourseSchema = z.object({
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

export const completeCourseSchema = z.object({
  body: z.object({}),
  params: z.object({
    courseId: z
      .string({ error: "Course ID is required." })
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid course ID format."),
  }),
});
