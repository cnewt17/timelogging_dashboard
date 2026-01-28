import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface UseSortableTableReturn<T> {
  sortedData: T[];
  sortConfig: SortConfig<T>;
  requestSort: (key: keyof T) => void;
}

/**
 * Generic hook for sorting table data.
 * Click a column header to sort by that column.
 * Click again to toggle between ascending and descending.
 */
export function useSortableTable<T>(
  data: T[],
  defaultSort: SortConfig<T>,
): UseSortableTableReturn<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(defaultSort);

  const sortedData = useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // New column, default to ascending
      return { key, direction: "asc" };
    });
  };

  return { sortedData, sortConfig, requestSort };
}
