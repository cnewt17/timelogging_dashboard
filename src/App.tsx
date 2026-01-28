import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { DashboardLayout } from "./components/DashboardLayout";
import { TabNav } from "./components/TabNav";
import { ProjectBreakdownChart } from "./components/ProjectBreakdownChart";
import { TeamMemberBreakdown } from "./components/TeamMemberBreakdown";
import { DateRangePicker } from "./components/DateRangePicker";
import { getLast30Days } from "./utils/datePresets";
import type { DateRange } from "./utils/datePresets";
import type { ProjectTimeData, TeamMemberTimeData } from "./types/app";

const TABS = [
  { id: "projects", label: "By Project" },
  { id: "team", label: "By Team Member" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface SprintConfig {
  sprintStartDate: string;
  sprintLengthDays: number;
}

const DEFAULT_CONFIG: SprintConfig = {
  sprintStartDate: "2026-01-05",
  sprintLengthDays: 14,
};

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [dateRange, setDateRange] = useState<DateRange>(getLast30Days);
  const [sprintConfig, setSprintConfig] =
    useState<SprintConfig>(DEFAULT_CONFIG);

  // Fetch sprint config on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: SprintConfig) => setSprintConfig(data))
      .catch(() => {
        // Use defaults on error
      });
  }, []);

  // Placeholder data - will be replaced with actual data fetching
  const projectData: ProjectTimeData[] = [];
  const teamMemberData: TeamMemberTimeData[] = [];

  return (
    <DashboardLayout
      headerChildren={
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          sprintStartDate={sprintConfig.sprintStartDate}
          sprintLengthDays={sprintConfig.sprintLengthDays}
        />
      }
    >
      <div className="space-y-6">
        <TabNav
          tabs={[...TABS]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {activeTab === "projects" && (
            <ProjectBreakdownChart projects={projectData} />
          )}

          {activeTab === "team" && (
            <TeamMemberBreakdown members={teamMemberData} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
