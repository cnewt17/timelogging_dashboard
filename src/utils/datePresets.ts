import {
  startOfMonth,
  endOfMonth,
  subDays,
  addDays,
  differenceInDays,
  format,
  parse,
} from "date-fns";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

const API_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Formats a Date object to the API date string format (YYYY-MM-DD).
 */
export function formatDateForApi(date: Date): string {
  return format(date, API_DATE_FORMAT);
}

/**
 * Parses an API date string (YYYY-MM-DD) to a Date object.
 */
export function parseApiDate(dateStr: string): Date {
  return parse(dateStr, API_DATE_FORMAT, new Date());
}

/**
 * Calculates which sprint number the given date falls into.
 * Returns 0 if the date is before the first sprint.
 */
function getSprintNumber(
  date: Date,
  sprintStart: Date,
  sprintLengthDays: number,
): number {
  const daysSinceStart = differenceInDays(date, sprintStart);
  if (daysSinceStart < 0) return 0;
  return Math.floor(daysSinceStart / sprintLengthDays);
}

/**
 * Gets the date range for the current sprint.
 */
export function getThisSprint(
  sprintStartDate: string,
  sprintLengthDays: number,
): DateRange {
  const sprintStart = parseApiDate(sprintStartDate);
  const today = new Date();

  const sprintNumber = getSprintNumber(today, sprintStart, sprintLengthDays);

  // If we're before the first sprint, return the first sprint
  const currentSprintStart = addDays(
    sprintStart,
    sprintNumber * sprintLengthDays,
  );
  const currentSprintEnd = addDays(currentSprintStart, sprintLengthDays - 1);

  return {
    startDate: currentSprintStart,
    endDate: currentSprintEnd,
  };
}

/**
 * Gets the date range for the previous sprint.
 */
export function getLastSprint(
  sprintStartDate: string,
  sprintLengthDays: number,
): DateRange {
  const sprintStart = parseApiDate(sprintStartDate);
  const today = new Date();

  const currentSprintNumber = getSprintNumber(
    today,
    sprintStart,
    sprintLengthDays,
  );

  // If we're in sprint 0 or before, return the same as "this sprint" (first sprint)
  const lastSprintNumber = Math.max(0, currentSprintNumber - 1);

  const lastSprintStart = addDays(
    sprintStart,
    lastSprintNumber * sprintLengthDays,
  );
  const lastSprintEnd = addDays(lastSprintStart, sprintLengthDays - 1);

  return {
    startDate: lastSprintStart,
    endDate: lastSprintEnd,
  };
}

/**
 * Gets the date range for the current calendar month.
 */
export function getThisMonth(): DateRange {
  const today = new Date();
  return {
    startDate: startOfMonth(today),
    endDate: endOfMonth(today),
  };
}

/**
 * Gets the date range for the last 30 days (including today).
 */
export function getLast30Days(): DateRange {
  const today = new Date();
  return {
    startDate: subDays(today, 29),
    endDate: today,
  };
}

export type PresetId = "this-sprint" | "last-sprint" | "this-month" | "last-30";

export interface PresetOption {
  id: PresetId;
  label: string;
  getRange: (sprintStartDate: string, sprintLengthDays: number) => DateRange;
}

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: "this-sprint",
    label: "This Sprint",
    getRange: getThisSprint,
  },
  {
    id: "last-sprint",
    label: "Last Sprint",
    getRange: getLastSprint,
  },
  {
    id: "this-month",
    label: "This Month",
    getRange: () => getThisMonth(),
  },
  {
    id: "last-30",
    label: "Last 30 Days",
    getRange: () => getLast30Days(),
  },
];

/**
 * Checks if two date ranges are equal (same start and end dates).
 */
export function areDateRangesEqual(a: DateRange, b: DateRange): boolean {
  return (
    formatDateForApi(a.startDate) === formatDateForApi(b.startDate) &&
    formatDateForApi(a.endDate) === formatDateForApi(b.endDate)
  );
}
