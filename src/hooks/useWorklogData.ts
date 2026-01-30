import { useState, useCallback, useRef } from "react";
import type { JiraIssue, JiraWorklog } from "@/types/jira";
import type {
  ProjectTimeData,
  TeamMemberTimeData,
  WorklogEntry,
} from "@/types/app";
import {
  transformToWorklogEntries,
  aggregateByProject,
  aggregateByTeamMember,
} from "@/utils/dataAggregation";
import { formatDateForApi } from "@/utils/datePresets";
import type { DateRange } from "@/utils/datePresets";

interface WorklogApiResponse {
  issues: JiraIssue[];
  worklogs: Record<string, JiraWorklog[]>;
}

export interface WorklogData {
  projects: ProjectTimeData[];
  teamMembers: TeamMemberTimeData[];
  issues: JiraIssue[];
  entries: WorklogEntry[];
}

interface CacheEntry {
  data: WorklogData;
  timestamp: number;
}

interface UseWorklogDataReturn {
  data: WorklogData | null;
  isLoading: boolean;
  error: string | null;
  fetchData: (range: DateRange) => Promise<void>;
  clearError: () => void;
}

// In-memory cache keyed by "startDate|endDate"
const cache = new Map<string, CacheEntry>();

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(range: DateRange): string {
  return `${formatDateForApi(range.startDate)}|${formatDateForApi(range.endDate)}`;
}

function getCachedData(range: DateRange): WorklogData | null {
  const key = getCacheKey(range);
  const entry = cache.get(key);

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedData(range: DateRange, data: WorklogData): void {
  const key = getCacheKey(range);
  cache.set(key, { data, timestamp: Date.now() });
}

export function useWorklogData(): UseWorklogDataReturn {
  const [data, setData] = useState<WorklogData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track current fetch to prevent race conditions
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async (range: DateRange): Promise<void> => {
    // Check cache first
    const cached = getCachedData(range);
    if (cached) {
      setData(cached);
      setError(null);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/jira/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formatDateForApi(range.startDate),
          endDate: formatDateForApi(range.endDate),
        }),
      });

      // Check if this fetch is still current
      if (fetchId !== fetchIdRef.current) return;

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage =
          errorBody.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result: WorklogApiResponse = await response.json();

      // Convert worklogs object back to Map
      const worklogMap = new Map<string, JiraWorklog[]>(
        Object.entries(result.worklogs),
      );

      // Transform and aggregate data
      const entries = transformToWorklogEntries(result.issues, worklogMap);
      const projects = aggregateByProject(entries, result.issues);
      const teamMembers = aggregateByTeamMember(entries);

      const worklogData: WorklogData = {
        projects,
        teamMembers,
        issues: result.issues,
        entries,
      };

      // Cache the result
      setCachedData(range, worklogData);

      // Only update state if this is still the current fetch
      if (fetchId === fetchIdRef.current) {
        setData(worklogData);
      }
    } catch (err) {
      // Only update error if this is still the current fetch
      if (fetchId === fetchIdRef.current) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setError(message);
      }
    } finally {
      // Only clear loading if this is still the current fetch
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, isLoading, error, fetchData, clearError };
}
