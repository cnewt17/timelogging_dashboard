import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold">Jira Time Logging Dashboard</h1>
      </header>
      <main className="p-6">
        <p className="text-gray-500">Dashboard coming soon.</p>
      </main>
    </div>
  );
}

function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-semibold mb-2">Setup</h1>
        <p className="text-gray-500">Configuration form coming soon.</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
