"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCog,
  Settings,
} from "lucide-react";
import { type UserRole } from "@/types/database";

interface SidebarProps {
  role: UserRole;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/doctor",
    icon: LayoutDashboard,
    roles: ["doctor"],
  },
  {
    label: "Dashboard",
    href: "/operator",
    icon: LayoutDashboard,
    roles: ["operator"],
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: CalendarDays,
    roles: ["doctor", "operator"],
  },
  {
    label: "Operators",
    href: "/operators",
    icon: UserCog,
    roles: ["doctor"],
  },
  {
    label: "Procedure Setting",
    href: "/settings",
    icon: Settings,
    roles: ["doctor"],
  },
];

export function Sidebar({ role = "operator" }: SidebarProps) {
  const pathname = usePathname();
  const currentRole = role || "operator";

  const filteredItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <>
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="w-64 border-r border-[#E8DFD1] dark:border-[#1E293B] bg-[#FAF7F2] dark:bg-[#0B1120] hidden md:flex flex-col shrink-0 min-h-[calc(100vh-65px)] transition-colors">
        <div className="p-4 space-y-1.5 flex-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/doctor" &&
                item.href !== "/operator" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-base sm:text-lg font-bold transition-all duration-150 ${
                  isActive
                    ? "bg-[#1E1915] text-[#FAF7F2] dark:bg-[#D4AF37] dark:text-[#12100E] shadow-md shadow-[#1E1915]/10 border border-[#2B1E14] dark:border-[#E5C158]"
                    : "text-[#6B5E51] dark:text-[#94A3B8] hover:text-[#1E1915] dark:hover:text-[#FAF7F2] hover:bg-[#EFE6D8]/60 dark:hover:bg-[#1E293B]/60 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#D8C5AD] dark:text-[#12100E]" : "text-[#8C7A6B] dark:text-[#94A3B8]"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 2. Mobile Bottom Bar (Thumb-friendly navigation on phones/tablets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF6]/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-t border-[#E8DFD1] dark:border-[#1E293B] flex md:hidden items-center justify-around py-1.5 px-1 sm:px-2 shadow-lg transition-colors">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/doctor" &&
              item.href !== "/operator" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-xl transition-all duration-150 flex-1 min-w-0 ${
                isActive
                  ? "bg-[#1E1915] text-[#FAF7F2] dark:bg-[#D4AF37] dark:text-[#12100E] shadow-sm shadow-[#1E1915]/10 font-bold"
                  : "text-[#6B5E51] dark:text-[#94A3B8] hover:text-[#1E1915] dark:hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-[#D8C5AD] dark:text-[#12100E]" : "text-[#8C7A6B] dark:text-[#94A3B8]"
                }`}
              />
              <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 tracking-tight truncate max-w-full text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
