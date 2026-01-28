import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { DashboardLayout } from "./components/DashboardLayout";
import { TabNav } from "./components/TabNav";
import { ProjectBreakdownChart } from "./components/ProjectBreakdownChart";
import { EmptyState } from "./components/common";
import type { ProjectTimeData } from "./types/app";

const TABS = [
  { id: "projects", label: "By Project" },
  { id: "team", label: "By Team Member" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("projects");

  // Placeholder data - will be replaced with actual data fetching
  const projectData: ProjectTimeData[] = [];

  return (
    <DashboardLayout>
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
            <EmptyState
              message="Team Member View"
              description="Coming soon in F2.5"
            />
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
