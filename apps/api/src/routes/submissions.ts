import type { FastifyInstance } from "fastify";
import {
  createSubmissionSchema,
  listSubmissionsSchema,
} from "@code-optimizer/shared";
import {
  createSubmission,
  getSubmissionById,
  listSubmissions,
  getSubmissionStatus,
} from "../services/submission.service.js";
import { enqueueOptimization } from "../services/queue.service.js";

export async function submissionRoutes(app: FastifyInstance) {
  // Create a new submission
  app.post("/api/submissions", async (request, reply) => {
    const input = createSubmissionSchema.parse(request.body);

    const submission = await createSubmission(input);
    await enqueueOptimization(submission.id);

    return reply.status(201).send({
      id: submission.id,
      status: submission.status,
      language: submission.language,
      optimizationGoal: submission.optimizationGoal,
      createdAt: submission.createdAt.toISOString(),
    });
  });

  // Get submission detail with all variants and results
  app.get<{ Params: { id: string } }>(
    "/api/submissions/:id",
    async (request, reply) => {
      const result = await getSubmissionById(request.params.id);

      if (!result) {
        return reply.status(404).send({ error: "Submission not found" });
      }

      return reply.send(result);
    },
  );

  // Lightweight status polling
  app.get<{ Params: { id: string } }>(
    "/api/submissions/:id/status",
    async (request, reply) => {
      const result = await getSubmissionStatus(request.params.id);

      if (!result) {
        return reply.status(404).send({ error: "Submission not found" });
      }

      return reply.send(result);
    },
  );

  // List submissions (paginated)
  app.get("/api/submissions", async (request, reply) => {
    const input = listSubmissionsSchema.parse(request.query);
    const result = await listSubmissions(input);
    return reply.send(result);
  });
}
