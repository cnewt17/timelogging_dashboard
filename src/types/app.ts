import { z } from "zod";

// ---------------------------------------------------------------------------
// App-level normalized types
// These are the shapes our application works with after transforming raw
// Jira API responses. Strict (no passthrough) since we control these.
// ---------------------------------------------------------------------------

/** Jira connection configuration stored in LocalStorage */
export const jiraConfigSchema = z.object({
  domain: z.string().min(1),
  email: z.email(),
  apiToken: z.string().min(1),
});
export type JiraConfig = z.infer<typeof jiraConfigSchema>;

/** Author info extracted and flattened from Jira user objects */
export const worklogAuthorSchema = z.object({
  accountId: z.string(),
  displayName: z.string(),
  emailAddress: z.string().optional(),
});
export type WorklogAuthor = z.infer<typeof worklogAuthorSchema>;

/** A single worklog entry, flattened with issue/project context */
export const worklogEntrySchema = z.object({
  id: z.string(),
  issueKey: z.string(),
  issueSummary: z.string(),
  projectKey: z.string(),
  projectName: z.string(),
  author: worklogAuthorSchema,
  timeSpentSeconds: z.number(),
  started: z.string(),
  comment: z.string().optional(),
});
export type WorklogEntry = z.infer<typeof worklogEntrySchema>;

/** Aggregated time data for a single ticket */
export const ticketTimeDataSchema = z.object({
  issueKey: z.string(),
  summary: z.string(),
  totalHours: z.number(),
  assignee: z.string(),
  status: z.string(),
  worklogs: z.array(worklogEntrySchema),
});
export type TicketTimeData = z.infer<typeof ticketTimeDataSchema>;

/** Aggregated time data for a project */
export const projectTimeDataSchema = z.object({
  projectKey: z.string(),
  projectName: z.string(),
  totalHours: z.number(),
  ticketCount: z.number(),
  contributors: z.array(z.string()),
  tickets: z.array(ticketTimeDataSchema),
});
export type ProjectTimeData = z.infer<typeof projectTimeDataSchema>;

/** Date range for filtering */
export const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});
export type DateRange = z.infer<typeof dateRangeSchema>;
