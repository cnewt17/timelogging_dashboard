import type { ProjectTimeData } from "@/types/app";
import { TicketDetailsTable } from "./TicketDetailsTable";
import { formatHours } from "@/utils/timeCalculations";

interface ProjectDrillDownProps {
  project: ProjectTimeData;
  jiraDomain: string;
  onClose: () => void;
}

export function ProjectDrillDown({
  project,
  jiraDomain,
  onClose,
}: ProjectDrillDownProps) {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {project.projectName}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({project.projectKey})
            </span>
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">{formatHours(project.totalHours)}</span>
            {" hours logged across "}
            <span className="font-medium">{project.ticketCount}</span>
            {" ticket"}
            {project.ticketCount !== 1 && "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close project details"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Contributors summary */}
      {project.contributors.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700">Contributors</h3>
          <p className="mt-1 text-sm text-gray-600">
            {project.contributors.join(", ")}
          </p>
        </div>
      )}

      {/* Ticket table */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="mb-3 text-sm font-medium text-gray-700">Tickets</h3>
        <TicketDetailsTable tickets={project.tickets} jiraDomain={jiraDomain} />
      </div>
    </div>
  );
}
