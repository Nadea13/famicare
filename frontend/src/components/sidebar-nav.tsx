"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  Bell,
  Search,
  Plus,
  Settings,
  Users,
  Calendar,
  Heart,
  LogOut,
  UserPlus,
  HeartPulse,
  FileText,
  BriefcaseMedical,
  HelpCircle,
  Home
} from "lucide-react";
import { api } from "@/lib/api";

/* --- Navigation Items --- */

const navItems = [
  { href: "/home", label: "หน้าหลัก", icon: HeartPulse },
  { href: "/home/patients", label: "ผู้ป่วย", icon: UserPlus },
  { href: "/home/medical-record", label: "ประวัติสุขภาพ", icon: FileText },
  { href: "/home/medications", label: "รายการยา", icon: BriefcaseMedical },
  { href: "/home/appointments", label: "การนัดหมาย", icon: Calendar },
];

const secondaryNavItems = [
  { href: "/help", label: "ศูนย์ช่วยเหลือ", icon: HelpCircle },
  { href: "/logout", label: "ออกจากระบบ", icon: LogOut },
];

/* --- Sidebar Content --- */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ display_name: string; picture_url: string; role: string; primary_patient_id?: string | null } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setUser({
            ...profile,
            role: "ผู้สร้าง"
          });
        }
      } catch (error) {
        console.error("Failed to load sidebar profile:", error);
      }
    }
    loadProfile();
  }, []);

  return (
    <div className="flex flex-col h-full border-r space-y-3 p-6">
      {/* Brand Logo */}
      <div>
        <Link
          href="/home"
          className="flex items-center gap-2 group"
          onClick={onNavigate}
        >
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shadow-sm">
            <HeartPulse className="text-white w-5 h-5 stroke-[2]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            FamilyCare
          </h1>
        </Link>
      </div>

      {/* User Profile Card in Sidebar */}
      <div>
        <div className="flex flex-row items-center bg-card border p-3 gap-3 rounded-md">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0">
            {user?.picture_url ? (
              <img
                src={user.picture_url}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              user?.display_name?.slice(0, 2) || "??"
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-foreground truncate">
              {user?.display_name || "กำลังโหลด..."}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 p-3 rounded-md text-sm
                transition-all duration-200 group
                ${isActive
                  ? "bg-muted-foreground/20 text-secondary-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <item.icon
                className={`shrink-0 w-5 h-5 transition-colors stroke-[2] ${isActive ? "text-secondary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="space-y-3">
        <div>
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <item.icon className="shrink-0 w-5 h-5 transition-colors stroke-[2]" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Exported Sidebar Component ──────────────────────────── */

export function SidebarNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 border-b border-slate-200 bg-white z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden p-2 hover:bg-slate-100 rounded-md shrink-0 text-slate-600 transition-colors">
              <LayoutGrid className="h-6 w-6" />
              <span className="sr-only">เปิดเมนู</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-none shadow-2xl">
              <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-sm">
              <HeartPulse className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-foreground">FamilyCare</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-500 rounded-full">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-500 rounded-full">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </>
  );
}
