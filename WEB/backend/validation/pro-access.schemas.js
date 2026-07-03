import { z } from "zod";
import { paginationQuerySchema } from "./admin.schemas.js";

const objectIdSchema = z
  .string({ error: "A valid request ID is required." })
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "ID must be a valid 24-character hexadecimal value.");

export const createProAccessRequestSchema = z.object({
  learningGoal: z.enum(
    [
      "career-switch",
      "skill-up",
      "portfolio-project",
      "interview-prep",
      "academic-study",
      "other",
    ],
    { error: "Choose a valid learning goal." },
  ),
  needReason: z
    .string({ error: "Reason is required." })
    .trim()
    .min(20, "Reason must be at least 20 characters.")
    .max(1000, "Reason must be at most 1000 characters."),
  expectedDurationDays: z.coerce
    .number({ error: "Expected duration is required." })
    .int("Expected duration must be a whole number.")
    .refine((value) => [7, 14, 30].includes(value), {
      message: "Expected duration must be 7, 14, or 30 days.",
    }),
});

export const adminProAccessRequestsListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: paginationQuerySchema.extend({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});

export const adminReviewProAccessRequestSchema = z.object({
  body: z.object({
    action: z.enum(["approve", "reject"], {
      error: "Action must be approve or reject.",
    }),
    adminNote: z
      .string()
      .trim()
      .max(1000, "Admin note must be at most 1000 characters.")
      .optional(),
  }),
  params: z.object({
    requestId: objectIdSchema,
  }),
  query: z.object({}).passthrough(),
});
