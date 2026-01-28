import type { ProjectTimeData } from "@/types/app";
import { BarChart } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/common";

const MAX_PROJECTS = 20;

interface ProjectBreakdownChartProps {
  projects: ProjectTimeData[];
  className?: string;
}

export function ProjectBreakdownChart({
  projects,
  className = "",
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

  const chartData = displayProjects.map((project) => ({
    name: project.projectName,
    hours: project.totalHours,
  }));

  const chartHeight = Math.max(200, displayProjects.length * 32);

  return (
    <div className={className}>
      <BarChart
        data={chartData}
        bars={[{ dataKey: "hours", name: "Hours Logged" }]}
        xAxisKey="name"
        layout="vertical"
        height={chartHeight}
        ariaLabel="Project breakdown chart showing hours logged per project"
      />
      {isTruncated && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Showing top {MAX_PROJECTS} of {projects.length} projects
        </p>
      )}
    </div>
  );
}
