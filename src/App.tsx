import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { DashboardLayout } from "./components/DashboardLayout";
import { TabNav } from "./components/TabNav";
import { ProjectBreakdownChart } from "./components/ProjectBreakdownChart";
import { TeamMemberBreakdown } from "./components/TeamMemberBreakdown";
import { DateRangePicker } from "./components/DateRangePicker";
import { LoadingSpinner, Toast } from "./components/common";
import { useWorklogData } from "./hooks/useWorklogData";
import { getLast30Days } from "./utils/datePresets";
import type { DateRange } from "./utils/datePresets";

const TABS = [
  { id: "projects", label: "By Project" },
  { id: "team", label: "By Team Member" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface AppConfig {
  sprintStartDate: string;
  sprintLengthDays: number;
  jiraDomain: string;
}

const DEFAULT_CONFIG: AppConfig = {
  sprintStartDate: "2026-01-05",
  sprintLengthDays: 14,
  jiraDomain: "",
};

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [dateRange, setDateRange] = useState<DateRange>(getLast30Days);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const { data, isLoading, error, fetchData, clearError } = useWorklogData();

  // Fetch app config on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: AppConfig) => setAppConfig(data))
      .catch(() => {
        // Use defaults on error
      });
  }, []);

  // Fetch data when date range changes (triggered by Apply button)
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
    fetchData(newRange);
  };

  const projectData = data?.projects ?? [];
  const teamMemberData = data?.teamMembers ?? [];

  return (
    <DashboardLayout
      headerChildren={
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          sprintStartDate={appConfig.sprintStartDate}
          sprintLengthDays={appConfig.sprintLengthDays}
          isLoading={isLoading}
        />
      }
    >
      <div className="space-y-6">
        {/* Error toast */}
        {error && (
          <Toast
            message={error}
            type="error"
            onDismiss={clearError}
            autoDismissMs={10000}
          />
        )}

        <TabNav
          tabs={[...TABS]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        <div className="relative bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70">
              <LoadingSpinner message="Loading worklog data..." />
            </div>
          )}

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
