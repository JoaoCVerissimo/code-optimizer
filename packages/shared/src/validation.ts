import { z } from "zod";
import { OPTIMIZATION_GOALS, SUPPORTED_LANGUAGES } from "./types/optimization.js";
import { MAX_CODE_SIZE_BYTES } from "./constants.js";

export const createSubmissionSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(MAX_CODE_SIZE_BYTES, `Code must be under ${MAX_CODE_SIZE_BYTES / 1024}KB`),
  language: z.enum(SUPPORTED_LANGUAGES),
  optimizationGoal: z.enum(OPTIMIZATION_GOALS),
});

export const listSubmissionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["pending", "optimizing", "benchmarking", "completed", "failed"])
    .optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type ListSubmissionsInput = z.infer<typeof listSubmissionsSchema>;
