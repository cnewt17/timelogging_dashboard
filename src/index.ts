import { serve } from "bun";
import index from "./index.html";
import { jiraConfigSchema } from "@/types/app";
import { JiraApiClient, JiraApiError } from "@/services/jiraApiClient";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Load config from environment variables
// ---------------------------------------------------------------------------

const configResult = jiraConfigSchema.safeParse({
  domain: process.env.JIRA_DOMAIN,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN,
  projectKeys: process.env.JIRA_PROJECT_KEYS?.split(",")
    .map((k) => k.trim())
    .filter(Boolean),
});

if (!configResult.success) {
  console.error("Invalid or missing Jira configuration in .env file:");
  for (const issue of configResult.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error(
    "\nCreate a .env file based on .env.example and restart the server.",
  );
  process.exit(1);
}

const jiraClient = new JiraApiClient(configResult.data);

// ---------------------------------------------------------------------------
// Sprint configuration (with defaults)
// ---------------------------------------------------------------------------

const sprintConfig = {
  sprintStartDate: process.env.SPRINT_START_DATE || "2026-01-05",
  sprintLengthDays: parseInt(process.env.SPRINT_LENGTH_DAYS || "14", 10),
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

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
      async POST() {
        try {
          const result = await jiraClient.testConnection();
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
          const { startDate, endDate } = z
            .object({
              startDate: z.string(),
              endDate: z.string(),
            })
            .parse(body);
          const result = await jiraClient.fetchWorklogs(startDate, endDate);
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

    "/api/config": {
      GET() {
        return Response.json(sprintConfig);
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
