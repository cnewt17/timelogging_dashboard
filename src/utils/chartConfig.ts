/**
 * Shared chart configuration: color palette, default styling, and helpers.
 * Used by all chart wrapper components.
 */

// 12-color WCAG AA accessible palette (tested against white background).
// Ordered for visual distinction when shown side-by-side.
export const CHART_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#9333ea", // purple-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#ca8a04", // yellow-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
] as const;

/** Get a color by index, cycling through the palette if index exceeds length. */
export function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

/** Shared default configuration for all charts. */
export const CHART_DEFAULTS = {
  height: 400,
  minHeight: 200,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  tooltipStyle: {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      fontSize: "13px",
    },
    cursor: { fill: "rgba(0, 0, 0, 0.04)" },
  },
  axisStyle: {
    tick: { fontSize: 12, fill: "#6b7280" },
    axisLine: { stroke: "#e5e7eb" },
    tickLine: false as const,
  },
  gridStyle: {
    strokeDasharray: "3 3",
    stroke: "#f3f4f6",
  },
} as const;
