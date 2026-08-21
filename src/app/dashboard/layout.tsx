import { CronPoller } from "@/components/dashboard/cron-poller";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <CronPoller />
      </div>
      {children}
    </div>
  );
}
