import { describe, expect, test } from "bun:test";
import {
  transformToWorklogEntries,
  aggregateByTicket,
  aggregateByProject,
  aggregateByTeamMember,
} from "@/utils/dataAggregation";
import { secondsToHours, formatHours } from "@/utils/timeCalculations";
import type { JiraIssue, JiraWorklog } from "@/types/jira";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<JiraIssue> & { key: string }): JiraIssue {
  return {
    id: overrides.id ?? overrides.key,
    self: `https://test.atlassian.net/rest/api/3/issue/${overrides.key}`,
    key: overrides.key,
    fields: {
      summary: `Summary for ${overrides.key}`,
      status: {
        self: "",
        id: "1",
        name: "In Progress",
        statusCategory: { id: 1, key: "indeterminate", name: "In Progress" },
      },
      assignee: {
        self: "",
        accountId: "user-1",
        displayName: "Alice",
        active: true,
      },
      project: {
        self: "",
        id: "10001",
        key: "PROJ",
        name: "Project Alpha",
      },
      ...overrides.fields,
    },
  } as JiraIssue;
}

function makeWorklog(
  overrides: Partial<JiraWorklog> & { id: string },
): JiraWorklog {
  return {
    self: "",
    issueId: "10001",
    author: {
      self: "",
      accountId: "user-1",
      displayName: "Alice",
      active: true,
    },
    updateAuthor: {
      self: "",
      accountId: "user-1",
      displayName: "Alice",
      active: true,
    },
    started: "2025-01-15T09:00:00.000+0000",
    timeSpent: "1h",
    timeSpentSeconds: 3600,
    updated: "2025-01-15T09:00:00.000+0000",
    ...overrides,
  } as JiraWorklog;
}

// ---------------------------------------------------------------------------
// timeCalculations
// ---------------------------------------------------------------------------

describe("secondsToHours", () => {
  test("converts whole hours", () => {
    expect(secondsToHours(3600)).toBe(1);
    expect(secondsToHours(7200)).toBe(2);
  });

  test("converts fractional hours", () => {
    expect(secondsToHours(5400)).toBe(1.5);
    expect(secondsToHours(900)).toBe(0.25);
  });

  test("rounds to 2 decimal places", () => {
    // 1234 seconds = 0.34277... hours → 0.34
    expect(secondsToHours(1234)).toBe(0.34);
  });

  test("handles zero", () => {
    expect(secondsToHours(0)).toBe(0);
  });
});

describe("formatHours", () => {
  test("formats hours with suffix", () => {
    expect(formatHours(12.5)).toBe("12.5h");
    expect(formatHours(0)).toBe("0h");
    expect(formatHours(0.25)).toBe("0.25h");
  });
});

// ---------------------------------------------------------------------------
// transformToWorklogEntries
// ---------------------------------------------------------------------------

describe("transformToWorklogEntries", () => {
  test("returns empty array for empty inputs", () => {
    expect(transformToWorklogEntries([], new Map())).toEqual([]);
  });

  test("transforms a single worklog correctly", () => {
    const issues = [makeIssue({ key: "PROJ-1" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 })]],
    ]);

    const result = transformToWorklogEntries(issues, worklogMap);

    expect(result).toHaveLength(1);
    expect(result[0]!).toEqual({
      id: "wl-1",
      issueKey: "PROJ-1",
      issueSummary: "Summary for PROJ-1",
      projectKey: "PROJ",
      projectName: "Project Alpha",
      author: {
        accountId: "user-1",
        displayName: "Alice",
        emailAddress: undefined,
      },
      timeSpentSeconds: 3600,
      started: "2025-01-15T09:00:00.000+0000",
      comment: undefined,
    });
  });

  test("skips worklogs with no matching issue (orphaned)", () => {
    const issues = [makeIssue({ key: "PROJ-1" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1" })]],
      ["PROJ-999", [makeWorklog({ id: "wl-orphan" })]],
    ]);

    const result = transformToWorklogEntries(issues, worklogMap);
    expect(result).toHaveLength(1);
    expect(result[0]!.issueKey).toBe("PROJ-1");
  });

  test("handles multiple worklogs across multiple issues", () => {
    const issues = [
      makeIssue({ key: "PROJ-1" }),
      makeIssue({
        key: "PROJ-2",
        fields: {
          summary: "Another ticket",
          status: {
            self: "",
            id: "2",
            name: "Done",
            statusCategory: { id: 3, key: "done", name: "Done" },
          },
          assignee: null,
          project: { self: "", id: "10002", key: "BETA", name: "Project Beta" },
        },
      }),
    ];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1" }), makeWorklog({ id: "wl-2" })]],
      ["PROJ-2", [makeWorklog({ id: "wl-3" })]],
    ]);

    const result = transformToWorklogEntries(issues, worklogMap);
    expect(result).toHaveLength(3);
    expect(result.filter((e) => e.issueKey === "PROJ-1")).toHaveLength(2);
    expect(result.filter((e) => e.projectKey === "BETA")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// aggregateByTicket
// ---------------------------------------------------------------------------

describe("aggregateByTicket", () => {
  test("returns empty array for empty input", () => {
    expect(aggregateByTicket([], [])).toEqual([]);
  });

  test("aggregates worklogs by ticket with correct totals", () => {
    const issues = [makeIssue({ key: "PROJ-1" })];
    const worklogMap = new Map([
      [
        "PROJ-1",
        [
          makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 }),
          makeWorklog({ id: "wl-2", timeSpentSeconds: 1800 }),
        ],
      ],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTicket(entries, issues);

    expect(result).toHaveLength(1);
    expect(result[0]!.issueKey).toBe("PROJ-1");
    expect(result[0]!.totalHours).toBe(1.5);
    expect(result[0]!.assignee).toBe("Alice");
    expect(result[0]!.status).toBe("In Progress");
    expect(result[0]!.worklogs).toHaveLength(2);
  });

  test("falls back to 'Unassigned' for null assignee", () => {
    const issues = [
      makeIssue({
        key: "PROJ-1",
        fields: {
          summary: "Test",
          status: {
            self: "",
            id: "1",
            name: "Open",
            statusCategory: { id: 2, key: "new", name: "To Do" },
          },
          assignee: null,
          project: {
            self: "",
            id: "10001",
            key: "PROJ",
            name: "Project Alpha",
          },
        },
      }),
    ];
    const worklogMap = new Map([["PROJ-1", [makeWorklog({ id: "wl-1" })]]]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTicket(entries, issues);

    expect(result[0]!.assignee).toBe("Unassigned");
  });

  test("sorts results by totalHours descending", () => {
    const issues = [makeIssue({ key: "PROJ-1" }), makeIssue({ key: "PROJ-2" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 1800 })]],
      ["PROJ-2", [makeWorklog({ id: "wl-2", timeSpentSeconds: 7200 })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTicket(entries, issues);

    expect(result[0]!.issueKey).toBe("PROJ-2");
    expect(result[1]!.issueKey).toBe("PROJ-1");
  });

  test("includes zero-second worklogs", () => {
    const issues = [makeIssue({ key: "PROJ-1" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 0 })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTicket(entries, issues);

    expect(result).toHaveLength(1);
    expect(result[0]!.totalHours).toBe(0);
    expect(result[0]!.worklogs).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// aggregateByProject
// ---------------------------------------------------------------------------

describe("aggregateByProject", () => {
  test("returns empty array for empty input", () => {
    expect(aggregateByProject([], [])).toEqual([]);
  });

  test("aggregates worklogs by project with nested tickets", () => {
    const issues = [makeIssue({ key: "PROJ-1" }), makeIssue({ key: "PROJ-2" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 })]],
      ["PROJ-2", [makeWorklog({ id: "wl-2", timeSpentSeconds: 7200 })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByProject(entries, issues);

    expect(result).toHaveLength(1);
    expect(result[0]!.projectKey).toBe("PROJ");
    expect(result[0]!.totalHours).toBe(3);
    expect(result[0]!.ticketCount).toBe(2);
    expect(result[0]!.tickets).toHaveLength(2);
  });

  test("groups multiple projects separately", () => {
    const issues = [
      makeIssue({ key: "PROJ-1" }),
      makeIssue({
        key: "BETA-1",
        fields: {
          summary: "Beta ticket",
          status: {
            self: "",
            id: "1",
            name: "Open",
            statusCategory: { id: 2, key: "new", name: "To Do" },
          },
          assignee: null,
          project: {
            self: "",
            id: "10002",
            key: "BETA",
            name: "Project Beta",
          },
        },
      }),
    ];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 })]],
      ["BETA-1", [makeWorklog({ id: "wl-2", timeSpentSeconds: 7200 })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByProject(entries, issues);

    expect(result).toHaveLength(2);
    // Sorted by totalHours desc: BETA (2h) before PROJ (1h)
    expect(result[0]!.projectKey).toBe("BETA");
    expect(result[0]!.totalHours).toBe(2);
    expect(result[1]!.projectKey).toBe("PROJ");
    expect(result[1]!.totalHours).toBe(1);
  });

  test("collects unique contributors", () => {
    const issues = [makeIssue({ key: "PROJ-1" })];
    const worklogMap = new Map([
      [
        "PROJ-1",
        [
          makeWorklog({ id: "wl-1" }),
          makeWorklog({
            id: "wl-2",
            author: {
              self: "",
              accountId: "user-2",
              displayName: "Bob",
              active: true,
            },
            updateAuthor: {
              self: "",
              accountId: "user-2",
              displayName: "Bob",
              active: true,
            },
          }),
          makeWorklog({ id: "wl-3" }), // duplicate Alice
        ],
      ],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByProject(entries, issues);

    expect(result[0]!.contributors).toHaveLength(2);
    expect(result[0]!.contributors).toContain("Alice");
    expect(result[0]!.contributors).toContain("Bob");
  });
});

// ---------------------------------------------------------------------------
// aggregateByTeamMember
// ---------------------------------------------------------------------------

describe("aggregateByTeamMember", () => {
  test("returns empty array for empty input", () => {
    expect(aggregateByTeamMember([])).toEqual([]);
  });

  test("groups worklogs by team member accountId", () => {
    const issues = [makeIssue({ key: "PROJ-1" }), makeIssue({ key: "PROJ-2" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 })]],
      [
        "PROJ-2",
        [
          makeWorklog({
            id: "wl-2",
            timeSpentSeconds: 7200,
            author: {
              self: "",
              accountId: "user-2",
              displayName: "Bob",
              active: true,
            },
            updateAuthor: {
              self: "",
              accountId: "user-2",
              displayName: "Bob",
              active: true,
            },
          }),
        ],
      ],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTeamMember(entries);

    expect(result).toHaveLength(2);
    // Sorted desc: Bob (2h) before Alice (1h)
    expect(result[0]!.displayName).toBe("Bob");
    expect(result[0]!.totalHours).toBe(2);
    expect(result[1]!.displayName).toBe("Alice");
    expect(result[1]!.totalHours).toBe(1);
  });

  test("collects unique project keys per member", () => {
    const issues = [
      makeIssue({ key: "PROJ-1" }),
      makeIssue({
        key: "BETA-1",
        fields: {
          summary: "Beta ticket",
          status: {
            self: "",
            id: "1",
            name: "Open",
            statusCategory: { id: 2, key: "new", name: "To Do" },
          },
          assignee: null,
          project: {
            self: "",
            id: "10002",
            key: "BETA",
            name: "Project Beta",
          },
        },
      }),
    ];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1" })]],
      ["BETA-1", [makeWorklog({ id: "wl-2" })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTeamMember(entries);

    expect(result).toHaveLength(1);
    expect(result[0]!.projectKeys).toContain("PROJ");
    expect(result[0]!.projectKeys).toContain("BETA");
  });

  test("merges worklogs from same user across tickets", () => {
    const issues = [makeIssue({ key: "PROJ-1" }), makeIssue({ key: "PROJ-2" })];
    const worklogMap = new Map([
      ["PROJ-1", [makeWorklog({ id: "wl-1", timeSpentSeconds: 3600 })]],
      ["PROJ-2", [makeWorklog({ id: "wl-2", timeSpentSeconds: 1800 })]],
    ]);
    const entries = transformToWorklogEntries(issues, worklogMap);
    const result = aggregateByTeamMember(entries);

    expect(result).toHaveLength(1);
    expect(result[0]!.accountId).toBe("user-1");
    expect(result[0]!.totalHours).toBe(1.5);
    expect(result[0]!.worklogs).toHaveLength(2);
  });
});
