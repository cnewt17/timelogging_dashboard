import { z } from "zod";

// ---------------------------------------------------------------------------
// Raw Jira Cloud REST API v3 response schemas
// All use z.looseObject() to tolerate extra fields Jira may return.
// ---------------------------------------------------------------------------

/** User object returned by Jira (author, assignee, etc.) */
export const jiraUserSchema = z.looseObject({
  self: z.string(),
  accountId: z.string(),
  displayName: z.string(),
  active: z.boolean(),
  emailAddress: z.string().optional(),
});
export type JiraUser = z.infer<typeof jiraUserSchema>;

/** Status category nested inside a status object */
export const jiraStatusCategorySchema = z.looseObject({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});
export type JiraStatusCategory = z.infer<typeof jiraStatusCategorySchema>;

/** Issue status */
export const jiraStatusSchema = z.looseObject({
  self: z.string(),
  id: z.string(),
  name: z.string(),
  statusCategory: jiraStatusCategorySchema,
});
export type JiraStatus = z.infer<typeof jiraStatusSchema>;

/** Project reference on an issue */
export const jiraProjectSchema = z.looseObject({
  self: z.string(),
  id: z.string(),
  key: z.string(),
  name: z.string(),
});
export type JiraProject = z.infer<typeof jiraProjectSchema>;

/** Single worklog entry from GET /rest/api/3/issue/{key}/worklog */
export const jiraWorklogSchema = z.looseObject({
  self: z.string(),
  id: z.string(),
  issueId: z.string(),
  author: jiraUserSchema,
  updateAuthor: jiraUserSchema,
  started: z.string(),
  timeSpent: z.string(),
  timeSpentSeconds: z.number(),
  updated: z.string(),
  comment: z.unknown().optional(),
  visibility: z.unknown().optional(),
});
export type JiraWorklog = z.infer<typeof jiraWorklogSchema>;

/** Paginated response from GET /rest/api/3/issue/{key}/worklog */
export const jiraWorklogResponseSchema = z.looseObject({
  startAt: z.number(),
  maxResults: z.number(),
  total: z.number(),
  worklogs: z.array(jiraWorklogSchema),
});
export type JiraWorklogResponse = z.infer<typeof jiraWorklogResponseSchema>;

/** The `fields` object on a search result issue */
export const jiraIssueFieldsSchema = z.looseObject({
  summary: z.string(),
  status: jiraStatusSchema,
  assignee: jiraUserSchema.nullable().optional(),
  project: jiraProjectSchema,
  worklog: jiraWorklogResponseSchema.optional(),
});
export type JiraIssueFields = z.infer<typeof jiraIssueFieldsSchema>;

/** Single issue from a search response */
export const jiraIssueSchema = z.looseObject({
  id: z.string(),
  self: z.string(),
  key: z.string(),
  fields: jiraIssueFieldsSchema,
});
export type JiraIssue = z.infer<typeof jiraIssueSchema>;

/** Paginated response from GET /rest/api/3/search */
export const jiraSearchResponseSchema = z.looseObject({
  startAt: z.number(),
  maxResults: z.number(),
  total: z.number(),
  issues: z.array(jiraIssueSchema),
});
export type JiraSearchResponse = z.infer<typeof jiraSearchResponseSchema>;

/** Response from GET /rest/api/3/myself */
export const jiraMyselfResponseSchema = z.looseObject({
  self: z.string(),
  accountId: z.string(),
  displayName: z.string(),
  emailAddress: z.string(),
  active: z.boolean(),
});
export type JiraMyselfResponse = z.infer<typeof jiraMyselfResponseSchema>;
