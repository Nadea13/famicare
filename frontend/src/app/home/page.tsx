import { HealthDashboard } from "@/components/health-dashboard";

/**
 * Dashboard page — renders the main health tracking dashboard.
 * In production, this would fetch real patient data based on the
 * authenticated LINE user's linked patients.
 */
export default function DashboardPage() {
  return <HealthDashboard />;
}
