import { PaywallGuard } from "@/components/dashboard/paywall-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <PaywallGuard>
        {children}
      </PaywallGuard>
    </div>
  );
}
