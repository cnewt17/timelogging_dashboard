const SECONDS_PER_HOUR = 3600;

/** Convert seconds to hours, rounded to 2 decimal places. */
export function secondsToHours(seconds: number): number {
  return Math.round((seconds / SECONDS_PER_HOUR) * 100) / 100;
}

/** Format hours for display (e.g. "12.5h", "0.25h"). */
export function formatHours(hours: number): string {
  return `${hours}h`;
}
