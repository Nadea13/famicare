"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HealthDashboard } from "@/components/health-dashboard";

/**
 * Dashboard page — renders the main health tracking dashboard.
 * Includes a client-side auth guard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("famicare_token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <HealthDashboard />;
}
