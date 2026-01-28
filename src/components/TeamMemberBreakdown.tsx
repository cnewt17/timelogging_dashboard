import { useMemo } from "react";
import type { TeamMemberTimeData } from "@/types/app";
import { BarChart, type BarConfig } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/common";
import { getProjectHoursForMember } from "@/utils/dataAggregation";
import { getProjectColor, registerProjects } from "@/utils/projectColorMap";

const MAX_MEMBERS = 20;

interface TeamMemberBreakdownProps {
  members: TeamMemberTimeData[];
  className?: string;
}

interface ChartDataPoint {
  name: string;
  totalHours: number;
  [projectKey: string]: string | number;
}

export function TeamMemberBreakdown({
  members,
  className = "",
}: TeamMemberBreakdownProps) {
  if (members.length === 0) {
    return (
      <EmptyState
        message="No team member data"
        description="No time has been logged for the selected period."
        className={className}
      />
    );
  }

  const isTruncated = members.length > MAX_MEMBERS;
  const displayMembers = isTruncated ? members.slice(0, MAX_MEMBERS) : members;

  // Collect all unique project keys and register them for consistent colors
  const allProjectKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const member of displayMembers) {
      for (const key of member.projectKeys) {
        keys.add(key);
      }
    }
    const keyArray = [...keys];
    registerProjects(keyArray);
    return keyArray;
  }, [displayMembers]);

  // Build chart data: each row is a member, with a property per project
  const { chartData, bars, projectNameMap } = useMemo(() => {
    const projectNameMap = new Map<string, string>();
    const data: ChartDataPoint[] = [];

    for (const member of displayMembers) {
      const projectHours = getProjectHoursForMember(member);
      const dataPoint: ChartDataPoint = {
        name: member.displayName,
        totalHours: member.totalHours,
      };

      for (const ph of projectHours) {
        dataPoint[ph.projectKey] = ph.hours;
        projectNameMap.set(ph.projectKey, ph.projectName);
      }

      data.push(dataPoint);
    }

    // Build bars config for all projects that appear in the data
    const barsConfig: BarConfig[] = allProjectKeys.map((projectKey) => ({
      dataKey: projectKey,
      name: projectNameMap.get(projectKey) ?? projectKey,
      color: getProjectColor(projectKey),
    }));

    return { chartData: data, bars: barsConfig, projectNameMap };
  }, [displayMembers, allProjectKeys]);

  const chartHeight = Math.max(200, displayMembers.length * 32);

  // Custom tooltip formatter to show percentage
  const tooltipFormatter = (
    value: number,
    name: string,
    item: { payload: Record<string, unknown> },
  ): [string, string] => {
    const totalHours = (item.payload.totalHours as number) ?? 0;
    const percentage =
      totalHours > 0 ? ((value / totalHours) * 100).toFixed(1) : "0";
    return [`${value}h (${percentage}%)`, projectNameMap.get(name) ?? name];
  };

  return (
    <div className={className}>
      <BarChart
        data={chartData}
        bars={bars}
        xAxisKey="name"
        layout="vertical"
        height={chartHeight}
        stacked
        ariaLabel="Team member breakdown chart showing hours logged per person by project"
        tooltipFormatter={tooltipFormatter}
      />
      {isTruncated && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Showing top {MAX_MEMBERS} of {members.length} team members
        </p>
      )}
    </div>
  );
}
