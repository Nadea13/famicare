import type { Metadata } from "next";
import { SidebarNav } from "@/components/sidebar-nav";

export const metadata: Metadata = {
  title: "หน้าหลัก — FamilyCare",
  description: "ดูแลสุขภาพครอบครัว ติดตามข้อมูลสุขภาพผู้สูงอายุในครอบครัว",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SidebarNav />

      {/* Main content area — offset for sidebar on desktop */}
      <main className="lg:pl-72 min-h-screen pb-16 lg:pb-0">
        {/* Page content wrapper */}
        <div className="pt-16 lg:pt-0">
          <div className="p-3 md:p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
