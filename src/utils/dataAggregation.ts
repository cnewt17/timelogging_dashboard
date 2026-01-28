import type { JiraIssue, JiraWorklog } from "@/types/jira";
import type {
  WorklogEntry,
  TicketTimeData,
  ProjectTimeData,
  TeamMemberTimeData,
} from "@/types/app";
import { secondsToHours } from "./timeCalculations";

// ---------------------------------------------------------------------------
// Raw → Normalized transformation
// ---------------------------------------------------------------------------

/**
 * Transform raw Jira API responses into flat WorklogEntry objects.
 * Joins issue context (project, summary) onto each worklog.
 * Skips worklogs whose issueKey has no matching issue in the array.
 */
export function transformToWorklogEntries(
  issues: JiraIssue[],
  worklogMap: Map<string, JiraWorklog[]>,
): WorklogEntry[] {
  const issueByKey = new Map(issues.map((i) => [i.key, i]));
  const entries: WorklogEntry[] = [];

  for (const [issueKey, worklogs] of worklogMap) {
    const issue = issueByKey.get(issueKey);
    if (!issue) continue;

    for (const wl of worklogs) {
      entries.push({
        id: wl.id,
        issueKey,
        issueSummary: issue.fields.summary,
        projectKey: issue.fields.project.key,
        projectName: issue.fields.project.name,
        author: {
          accountId: wl.author.accountId,
          displayName: wl.author.displayName,
          emailAddress: wl.author.emailAddress,
        },
        timeSpentSeconds: wl.timeSpentSeconds,
        started: wl.started,
        comment: typeof wl.comment === "string" ? wl.comment : undefined,
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Aggregation: by ticket
// ---------------------------------------------------------------------------

/**
 * Group worklog entries by issueKey and compute totals.
 * Accepts the original JiraIssue[] to look up assignee and status
 * (these are issue-level fields not present on WorklogEntry).
 * Returns results sorted by totalHours descending.
 */
export function aggregateByTicket(
  entries: WorklogEntry[],
  issues: JiraIssue[],
): TicketTimeData[] {
  if (entries.length === 0) return [];

  const issueByKey = new Map(issues.map((i) => [i.key, i]));
  const grouped = new Map<string, WorklogEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.issueKey);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.issueKey, [entry]);
    }
  }

  const results: TicketTimeData[] = [];

  for (const [issueKey, worklogs] of grouped) {
    const first = worklogs[0];
    if (!first) continue;

    const issue = issueByKey.get(issueKey);
    const totalSeconds = worklogs.reduce(
      (sum, w) => sum + w.timeSpentSeconds,
      0,
    );

    results.push({
      issueKey,
      summary: first.issueSummary,
      totalHours: secondsToHours(totalSeconds),
      assignee: issue?.fields.assignee?.displayName ?? "Unassigned",
      status: issue?.fields.status.name ?? "Unknown",
      worklogs,
    });
  }

  return results.sort((a, b) => b.totalHours - a.totalHours);
}

// ---------------------------------------------------------------------------
// Aggregation: by project
// ---------------------------------------------------------------------------

/**
 * Group worklog entries by projectKey and compute totals.
 * Nests ticket-level aggregation within each project.
 * Returns results sorted by totalHours descending.
 */
export function aggregateByProject(
  entries: WorklogEntry[],
  issues: JiraIssue[],
): ProjectTimeData[] {
  if (entries.length === 0) return [];

  const grouped = new Map<string, WorklogEntry[]>();

  for (const entry of entries) {
    const existing = grouped.get(entry.projectKey);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.projectKey, [entry]);
    }
  }

  const results: ProjectTimeData[] = [];

  for (const [projectKey, projectEntries] of grouped) {
    const first = projectEntries[0];
    if (!first) continue;

    const totalSeconds = projectEntries.reduce(
      (sum, w) => sum + w.timeSpentSeconds,
      0,
    );

    const tickets = aggregateByTicket(projectEntries, issues);
    const uniqueIssueKeys = new Set(projectEntries.map((e) => e.issueKey));
    const uniqueContributors = [
      ...new Set(projectEntries.map((e) => e.author.displayName)),
    ];

    results.push({
      projectKey,
      projectName: first.projectName,
      totalHours: secondsToHours(totalSeconds),
      ticketCount: uniqueIssueKeys.size,
      contributors: uniqueContributors,
      tickets,
    });
  }

  return results.sort((a, b) => b.totalHours - a.totalHours);
}

// ---------------------------------------------------------------------------
// Aggregation: by team member
// ---------------------------------------------------------------------------

/**
 * Group worklog entries by author accountId and compute totals.
 * Returns results sorted by totalHours descending.
 */
export function aggregateByTeamMember(
  entries: WorklogEntry[],
): TeamMemberTimeData[] {
  if (entries.length === 0) return [];

  const grouped = new Map<
    string,
    { displayName: string; worklogs: WorklogEntry[] }
  >();

  for (const entry of entries) {
    const existing = grouped.get(entry.author.accountId);
    if (existing) {
      existing.worklogs.push(entry);
    } else {
      grouped.set(entry.author.accountId, {
        displayName: entry.author.displayName,
        worklogs: [entry],
      });
    }
  }

  const results: TeamMemberTimeData[] = [];

  for (const [accountId, { displayName, worklogs }] of grouped) {
    const totalSeconds = worklogs.reduce(
      (sum, w) => sum + w.timeSpentSeconds,
      0,
    );
    const projectKeys = [...new Set(worklogs.map((w) => w.projectKey))];

    results.push({
      accountId,
      displayName,
      totalHours: secondsToHours(totalSeconds),
      projectKeys,
      worklogs,
    });
  }

  return results.sort((a, b) => b.totalHours - a.totalHours);
}
