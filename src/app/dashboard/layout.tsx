import { CronPoller } from "@/components/dashboard/cron-poller";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed top-[72px] right-6 z-30">
        <div className="rounded-full border border-border-custom bg-surface/90 backdrop-blur px-3 py-1.5 shadow-sm">
          <CronPoller />
        </div>
      </div>
      {children}
    </div>
  );
}
