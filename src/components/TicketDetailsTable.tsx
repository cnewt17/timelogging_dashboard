import { useState } from "react";
import { useSortableTable } from "@/hooks/useSortableTable";
import { formatHours } from "@/utils/timeCalculations";
import type { TicketTimeData } from "@/types/app";

interface TicketDetailsTableProps {
  tickets: TicketTimeData[];
  jiraDomain: string;
}

type PageSize = 25 | 50 | 100;
const PAGE_SIZE_OPTIONS: PageSize[] = [25, 50, 100];

function buildJiraUrl(domain: string, issueKey: string): string {
  return `https://${domain}.atlassian.net/browse/${issueKey}`;
}

function SortIcon({
  isActive,
  direction,
}: {
  isActive: boolean;
  direction: "asc" | "desc";
}) {
  if (!isActive) {
    return (
      <svg
        className="ml-1 inline h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  return direction === "asc" ? (
    <svg
      className="ml-1 inline h-4 w-4 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="ml-1 inline h-4 w-4 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export function TicketDetailsTable({
  tickets,
  jiraDomain,
}: TicketDetailsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  const { sortedData, sortConfig, requestSort } = useSortableTable(tickets, {
    key: "totalHours",
    direction: "desc",
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Total hours across all tickets
  const totalHours = tickets.reduce((sum, t) => sum + t.totalHours, 0);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Column header button
  const SortableHeader = ({
    label,
    sortKey,
    className = "",
  }: {
    label: string;
    sortKey: keyof TicketTimeData;
    className?: string;
  }) => (
    <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-900 ${className}`}>
      <button
        type="button"
        onClick={() => requestSort(sortKey)}
        className="inline-flex items-center hover:text-blue-600"
      >
        {label}
        <SortIcon
          isActive={sortConfig.key === sortKey}
          direction={sortConfig.direction}
        />
      </button>
    </th>
  );

  if (tickets.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">No tickets to display.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pagination controls - top */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1}-{endIndex} of {sortedData.length} tickets
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Per page:
            <select
              value={pageSize}
              onChange={(e) =>
                handlePageSizeChange(Number(e.target.value) as PageSize)
              }
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Table with horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Ticket ID" sortKey="issueKey" />
              <SortableHeader
                label="Summary"
                sortKey="summary"
                className="min-w-[200px]"
              />
              <SortableHeader label="Assignee" sortKey="assignee" />
              <SortableHeader label="Hours" sortKey="totalHours" />
              <SortableHeader label="Status" sortKey="status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.map((ticket) => (
              <tr
                key={ticket.issueKey}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {jiraDomain ? (
                    <a
                      href={buildJiraUrl(jiraDomain, ticket.issueKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {ticket.issueKey}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {ticket.issueKey}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <span className="line-clamp-2">{ticket.summary}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {ticket.assignee}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {formatHours(ticket.totalHours)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {ticket.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={3}
                className="px-4 py-3 text-sm font-semibold text-gray-900"
              >
                Total
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                {formatHours(totalHours)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination controls - bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}
