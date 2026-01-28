import { Header } from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
  headerChildren?: React.ReactNode;
}

export function DashboardLayout({
  children,
  headerChildren,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header>{headerChildren}</Header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
