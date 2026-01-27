import { jiraConfigSchema, type JiraConfig } from "@/types";

const STORAGE_KEY = "jira-dashboard-config";

/**
 * Validates and persists Jira config to LocalStorage.
 * The API token is base64-encoded before storage.
 */
export function saveConfig(config: JiraConfig): void {
  const validated = jiraConfigSchema.parse(config);
  const toStore = {
    ...validated,
    apiToken: btoa(validated.apiToken),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // LocalStorage unavailable (quota exceeded, security restriction, etc.)
  }
}

/**
 * Loads Jira config from LocalStorage.
 * Returns null if missing, corrupt, or invalid.
 */
export function loadConfig(): JiraConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw);
    const decoded = {
      ...parsed,
      apiToken: atob(parsed.apiToken),
    };
    return jiraConfigSchema.parse(decoded);
  } catch {
    return null;
  }
}

/** Removes stored Jira config from LocalStorage. */
export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // LocalStorage unavailable
  }
}
