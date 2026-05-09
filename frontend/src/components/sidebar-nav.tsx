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

function SidebarContent({ user, onNavigate }: { user: any; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full border-r space-y-3 p-6">
      {/* Brand Logo */}
      <div>
        <Link
          href="/home"
          className="flex items-center gap-2 group"
          onClick={onNavigate}
        >
          <div className="flex items-center">
            <span className="font-black text-2xl text-foreground tracking-tight">Fami</span>
            <span className="font-black text-2xl text-primary tracking-tight">Care</span>
          </div>
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

/* ── Bottom Navigation for Mobile ────────────────────────── */

function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 px-2 pb-safe-offset-2 pt-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300
                ${isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <item.icon className={`w-5 h-5 stroke-[2] ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-black ${isActive ? "opacity-100" : "opacity-70"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── Exported Sidebar Component ──────────────────────────── */

export function SidebarNav() {
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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile Top Header (Minimal) */}
      <div className="lg:hidden fixed top-0 inset-x-0 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md z-40 flex items-center justify-between px-3">
        <div className="flex items-center">
          <span className="font-black text-2xl text-foreground tracking-tight">Fami</span>
          <span className="font-black text-2xl text-primary tracking-tight">Care</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Bell />
          </Button>
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
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </>
  );
}
