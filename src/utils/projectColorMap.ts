import { CHART_COLORS } from "./chartConfig";

/**
 * Project color registry for consistent colors across charts.
 * Uses a simple hash function to assign stable colors based on project key.
 */

const colorRegistry = new Map<string, string>();

/** Simple string hash function for stable color assignment. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a color for a project key.
 * Returns a stable color based on the project key hash.
 * If the project was pre-registered, returns the registered color.
 */
export function getProjectColor(projectKey: string): string {
  const existing = colorRegistry.get(projectKey);
  if (existing) return existing;

  const index = hashString(projectKey) % CHART_COLORS.length;
  const color = CHART_COLORS[index]!;
  colorRegistry.set(projectKey, color);
  return color;
}

/**
 * Pre-register a list of project keys to assign colors.
 * Call this once when data loads to ensure consistent color assignment
 * based on the order projects appear in the data.
 */
export function registerProjects(projectKeys: string[]): void {
  for (const key of projectKeys) {
    if (!colorRegistry.has(key)) {
      getProjectColor(key);
    }
  }
}

/**
 * Get the current color registry as a Map.
 * Useful for debugging or building legends.
 */
export function getProjectColorMap(): Map<string, string> {
  return new Map(colorRegistry);
}

/**
 * Clear the color registry.
 * Mainly useful for testing.
 */
export function clearProjectColors(): void {
  colorRegistry.clear();
}
