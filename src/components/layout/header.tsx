"use client";

import React, { useState, useEffect } from "react";
import { LogOut, Clock, Calendar, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Profile } from "@/types/database";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface HeaderProps {
  profile: Profile | null;
  clinicName?: string;
  tagline?: string;
}

export function Header({
  profile,
  clinicName = "Glow Derm",
  tagline = "Expert Laser and Skin Clinic",
}: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-[#E8DFD1] dark:border-[#1E293B] bg-[#FCFAF6]/90 dark:bg-[#0B1120]/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-sm transition-colors">
      {/* Clinic Brand (Luxury Glow Derm Brand & Subtitle) */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#1E1915] dark:bg-[#D4AF37] flex items-center justify-center shadow-md shadow-[#1E1915]/15 border border-[#2B1E14] dark:border-[#E5C158] flex-shrink-0">
          <span className="font-serif text-lg sm:text-2xl font-bold text-[#D8C5AD] dark:text-[#12100E] italic tracking-tight">
            {clinicName?.charAt(0)?.toUpperCase() || "G"}
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-2xl font-serif font-black tracking-tight text-[#1A120B] dark:text-[#FAF7F2] leading-none truncate">
            {clinicName}
          </h1>
          <p className="text-[10px] sm:text-xs text-[#8C6843] dark:text-[#E5C158] font-bold tracking-wider uppercase mt-0.5 sm:mt-1 truncate max-w-[130px] xs:max-w-[190px] sm:max-w-none">
            {tagline}
          </p>
        </div>
      </div>

      {/* Live Date, Time & Profile Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <div className="hidden md:flex items-center space-x-4 px-4 py-2 rounded-2xl bg-[#F4EFE6] dark:bg-[#1E293B] border border-[#E9DFD1] dark:border-[#2D3E58] shadow-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4.5 h-4.5 text-[#A8835A] dark:text-[#D4AF37]" />
            <span className="font-black text-base text-[#1A120B] dark:text-[#FAF7F2] tracking-tight">{date || "--"}</span>
          </div>
          <span className="text-[#C4A482] dark:text-[#64748B] font-black">|</span>
          <div className="flex items-center space-x-2">
            <Clock className="w-4.5 h-4.5 text-[#A8835A] dark:text-[#D4AF37]" />
            <span className="font-mono font-black text-base text-[#1A120B] dark:text-[#FAF7F2] tracking-tight">{time || "--:--:--"}</span>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ThemeToggle />

          <div className="flex items-center space-x-2 sm:space-x-3 text-right bg-[#F4EFE6] dark:bg-[#1E293B] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-[#E9DFD1] dark:border-[#2D3E58] shadow-xs">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2B1E14] dark:bg-[#0F172A] border border-[#4A3522] dark:border-[#334155] flex items-center justify-center text-[#E9DFD1] shrink-0">
              <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-black text-[#1A120B] dark:text-[#FAF7F2] leading-tight font-serif">
                {profile?.full_name || (profile?.role === "doctor" ? "Doctor Admin" : "Receptionist")}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[#8C7A6B] dark:text-[#94A3B8] hover:text-[#991B1B] dark:hover:text-[#F87171] bg-[#F4EFE6] dark:bg-[#1E293B] hover:bg-[#FEE2E2]/70 dark:hover:bg-[#EF4444]/20 border border-[#E9DFD1] dark:border-[#2D3E58] hover:border-[#FECACA] dark:hover:border-[#F87171]/40 transition-all text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 font-black shadow-xs"
          >
            <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
