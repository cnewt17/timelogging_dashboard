import type { ProjectTimeData } from "@/types/app";
import { BarChart } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/common";
import { registerProjects } from "@/utils/projectColorMap";

const MAX_PROJECTS = 20;

interface ProjectBreakdownChartProps {
  projects: ProjectTimeData[];
  className?: string;
  selectedProjectKey?: string | null;
  onProjectClick?: (projectKey: string) => void;
}

export function ProjectBreakdownChart({
  projects,
  className = "",
  selectedProjectKey,
  onProjectClick,
}: ProjectBreakdownChartProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        message="No project data"
        description="No time has been logged for the selected period."
        className={className}
      />
    );
  }

  const isTruncated = projects.length > MAX_PROJECTS;
  const displayProjects = isTruncated
    ? projects.slice(0, MAX_PROJECTS)
    : projects;

  // Register projects for consistent color assignment across charts
  registerProjects(displayProjects.map((p) => p.projectKey));

  const chartData = displayProjects.map((project) => ({
    name: project.projectName,
    hours: project.totalHours,
    projectKey: project.projectKey,
  }));

  const chartHeight = Math.max(200, displayProjects.length * 32);

  // Find the index of the selected project for highlighting
  const activeIndex = selectedProjectKey
    ? displayProjects.findIndex((p) => p.projectKey === selectedProjectKey)
    : null;

  const handleBarClick = onProjectClick
    ? (data: { payload: Record<string, unknown> }) => {
        const projectKey = data.payload.projectKey as string;
        onProjectClick(projectKey);
      }
    : undefined;

  return (
    <div className={className}>
      <BarChart
        data={chartData}
        bars={[{ dataKey: "hours", name: "Hours Logged" }]}
        xAxisKey="name"
        layout="vertical"
        height={chartHeight}
        ariaLabel="Project breakdown chart showing hours logged per project"
        onBarClick={handleBarClick}
        activeIndex={activeIndex === -1 ? null : activeIndex}
      />
      {isTruncated && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Showing top {MAX_PROJECTS} of {projects.length} projects
        </p>
      )}
    </div>
  );
}
