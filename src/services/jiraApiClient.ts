import {
  jiraMyselfResponseSchema,
  jiraSearchResponseSchema,
  jiraWorklogResponseSchema,
} from "@/types/jira";
import type {
  JiraMyselfResponse,
  JiraSearchResponse,
  JiraIssue,
  JiraWorklog,
} from "@/types/jira";
import type { JiraConfig } from "@/types/app";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type JiraApiErrorCode =
  | "AUTH_FAILED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export class JiraApiError extends Error {
  code: JiraApiErrorCode;
  status?: number;

  constructor(code: JiraApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = "JiraApiError";
    this.code = code;
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const SEARCH_PAGE_SIZE = 50;

export class JiraApiClient {
  private baseUrl: string;
  private authHeader: string;
  private projectKeys: string[];

  constructor(config: JiraConfig) {
    const domain = config.domain.replace(/\.atlassian\.net\/?$/, "");
    this.baseUrl = `https://${domain}.atlassian.net`;
    this.authHeader = `Basic ${btoa(`${config.email}:${config.apiToken}`)}`;
    this.projectKeys = config.projectKeys;
  }

  // -------------------------------------------------------------------------
  // Core fetch wrapper
  // -------------------------------------------------------------------------

  private async request(path: string): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: "GET",
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          return await res.json();
        }

        if (res.status === 401 || res.status === 403) {
          throw new JiraApiError(
            "AUTH_FAILED",
            "Authentication failed. Check your domain, email, and API token.",
            res.status,
          );
        }

        if (res.status === 429) {
          if (attempt < MAX_RETRIES) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new JiraApiError(
            "RATE_LIMITED",
            "Jira API rate limit exceeded. Try again later.",
            429,
          );
        }

        throw new JiraApiError(
          "UNKNOWN",
          `Jira API returned HTTP ${res.status}`,
          res.status,
        );
      } catch (err) {
        clearTimeout(timeout);

        if (err instanceof JiraApiError) throw err;

        if (err instanceof DOMException && err.name === "AbortError") {
          throw new JiraApiError(
            "TIMEOUT",
            "Request timed out after 30 seconds.",
          );
        }

        lastError = err;
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw new JiraApiError(
      "NETWORK_ERROR",
      `Network error: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  }

  // -------------------------------------------------------------------------
  // Public methods
  // -------------------------------------------------------------------------

  /** Validate credentials by calling GET /rest/api/3/myself */
  async testConnection(): Promise<JiraMyselfResponse> {
    const data = await this.request("/rest/api/3/myself");
    return jiraMyselfResponseSchema.parse(data);
  }

  /** Search issues with JQL, single page. */
  async searchIssues(
    jql: string,
    startAt = 0,
    maxResults = SEARCH_PAGE_SIZE,
  ): Promise<JiraSearchResponse> {
    const params = new URLSearchParams({
      jql,
      fields: "summary,status,assignee,project,worklog",
      startAt: String(startAt),
      maxResults: String(maxResults),
    });
    const data = await this.request(`/rest/api/3/search?${params}`);
    return jiraSearchResponseSchema.parse(data);
  }

  /** Fetch all worklogs for a single issue, handling pagination. */
  async fetchIssueWorklogs(issueKey: string): Promise<JiraWorklog[]> {
    const worklogs: JiraWorklog[] = [];
    let startAt = 0;

    for (;;) {
      const params = new URLSearchParams({
        startAt: String(startAt),
        maxResults: "1000",
      });
      const data = await this.request(
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog?${params}`,
      );
      const page = jiraWorklogResponseSchema.parse(data);
      worklogs.push(...page.worklogs);

      if (worklogs.length >= page.total) break;
      startAt = worklogs.length;
    }

    return worklogs;
  }

  /**
   * High-level method: fetch all issues with worklogs in the date range,
   * scoped to the configured project keys. Returns issues with their
   * worklogs filtered to only those within the requested date range.
   */
  async fetchWorklogs(
    startDate: string,
    endDate: string,
  ): Promise<{ issues: JiraIssue[]; worklogs: Map<string, JiraWorklog[]> }> {
    const projectList = this.projectKeys.map((k) => `"${k}"`).join(", ");
    const jql =
      `project IN (${projectList}) ` +
      `AND worklogDate >= "${startDate}" ` +
      `AND worklogDate <= "${endDate}"`;

    // Paginate through all matching issues
    const allIssues: JiraIssue[] = [];
    let startAt = 0;

    for (;;) {
      const page = await this.searchIssues(jql, startAt);
      allIssues.push(...page.issues);

      if (allIssues.length >= page.total) break;
      startAt = allIssues.length;
    }

    // Fetch full worklogs for each issue and filter by date range
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    // Set rangeEnd to end of day so worklogs on the end date are included
    rangeEnd.setHours(23, 59, 59, 999);

    const worklogMap = new Map<string, JiraWorklog[]>();

    for (const issue of allIssues) {
      const allWorklogs = await this.fetchIssueWorklogs(issue.key);
      const filtered = allWorklogs.filter((w) => {
        const started = new Date(w.started);
        return started >= rangeStart && started <= rangeEnd;
      });
      if (filtered.length > 0) {
        worklogMap.set(issue.key, filtered);
      }
    }

    return { issues: allIssues, worklogs: worklogMap };
  }
}
