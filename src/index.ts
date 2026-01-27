import { serve } from "bun";
import index from "./index.html";
import { jiraConfigSchema } from "@/types/app";
import { JiraApiClient, JiraApiError } from "@/services/jiraApiClient";
import { z } from "zod";

function errorResponse(err: unknown): Response {
  if (err instanceof JiraApiError) {
    const status =
      err.code === "AUTH_FAILED"
        ? 401
        : err.code === "RATE_LIMITED"
          ? 429
          : err.code === "TIMEOUT"
            ? 504
            : 500;
    return Response.json({ error: err.code, message: err.message }, { status });
  }
  if (err instanceof z.ZodError) {
    return Response.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: err.issues,
      },
      { status: 400 },
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  return Response.json({ error: "UNKNOWN", message }, { status: 500 });
}

const server = serve({
  routes: {
    "/api/jira/test-connection": {
      async POST(req) {
        try {
          const body = await req.json();
          const config = jiraConfigSchema.parse(body);
          const client = new JiraApiClient(config);
          const result = await client.testConnection();
          return Response.json(result);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },

    "/api/jira/worklogs": {
      async POST(req) {
        try {
          const body = await req.json();
          const schema = z.object({
            config: jiraConfigSchema,
            startDate: z.string(),
            endDate: z.string(),
          });
          const { config, startDate, endDate } = schema.parse(body);
          const client = new JiraApiClient(config);
          const result = await client.fetchWorklogs(startDate, endDate);
          // Convert Map to plain object for JSON serialization
          const worklogs: Record<string, unknown[]> = {};
          for (const [key, value] of result.worklogs) {
            worklogs[key] = value;
          }
          return Response.json({ issues: result.issues, worklogs });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },

    // Serve index.html for all unmatched routes (SPA fallback).
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
