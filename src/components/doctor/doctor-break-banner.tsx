"use client";

import React from "react";
import { type DoctorBreakInfo } from "@/types/database";
import {
  Coffee,
  Sparkles,
  Utensils,
  Zap,
  Clock,
  CheckCircle2,
  Loader2,
  PauseCircle,
  MessageSquare,
} from "lucide-react";

interface DoctorBreakBannerProps {
  breakInfo: DoctorBreakInfo;
  onEndBreak: () => Promise<void>;
  isLoading: boolean;
  isDoctorView?: boolean;
}

export function DoctorBreakBanner({
  breakInfo,
  onEndBreak,
  isLoading,
  isDoctorView = true,
}: DoctorBreakBannerProps) {
  const getIcon = (sizeClass = "w-5 h-5") => {
    switch (breakInfo.break_type) {
      case "Tea Break":
        return <Coffee className={sizeClass} />;
      case "Namaz Break":
        return <Sparkles className={sizeClass} />;
      case "Lunch Break":
        return <Utensils className={sizeClass} />;
      case "Quick Break":
        return <Zap className={sizeClass} />;
      default:
        return <Clock className={sizeClass} />;
    }
  };

  const hasNote = Boolean(breakInfo.custom_reason && breakInfo.custom_reason.trim().length > 0);

  return (
    <div className="p-4 sm:px-6 sm:py-4.5 rounded-3xl bg-gradient-to-r from-[#FCFAF6] via-[#FAF5EE] to-[#FCFAF6] dark:from-[#131B2A] dark:via-[#1A2438] dark:to-[#131B2A] border-2 border-[#8C6843] dark:border-[#D4AF37] shadow-lg shadow-[#8C6843]/10 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-center gap-3.5">
          {/* Active Break Icon Squircle with live ping */}
          <div className="w-12 h-12 rounded-2xl bg-[#8C6843] text-white dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shrink-0 shadow-sm relative">
            {getIcon("w-6 h-6")}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E5C158] dark:bg-[#34D399] animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#E5C158] dark:bg-[#34D399] ring-2 ring-white dark:ring-[#131B2A]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#8C6843] border-2 border-[#8C6843] dark:bg-[#0B1120] dark:text-[#CBD5E1] dark:border-2 dark:border-[#334155] text-[11px] font-black uppercase tracking-wider shadow-2xs">
                <PauseCircle className="w-3.5 h-3.5 text-[#8C6843] dark:text-[#94A3B8]" />
                {isDoctorView ? "You Are On Break" : "Doctor On Break"}
              </span>

              {/* Break Type Badge (Styled matching pill) */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8C6843] text-white border-2 border-[#745534] dark:bg-[#D4AF37] dark:text-[#12100E] dark:border-2 dark:border-[#E5C158] text-xs sm:text-sm font-black tracking-tight shadow-sm dark:shadow-[0_4px_16px_rgba(212,175,55,0.25)]">
                {getIcon("w-3.5 h-3.5")}
                <span>{breakInfo.break_type}</span>
              </span>
            </div>

            {/* Doctor Note - ONLY shown if doctor wrote a note */}
            {hasNote && (
              <div className="flex items-center gap-2 mt-2 text-sm sm:text-base text-[#5C4D3E] dark:text-[#E2E8F0] font-semibold bg-white/70 dark:bg-[#0B1120]/70 px-3.5 py-1.5 rounded-xl border border-[#E8DFD1] dark:border-[#243248] w-fit">
                <MessageSquare className="w-4 h-4 text-[#8C6843] dark:text-[#D4AF37] shrink-0" />
                <span className="italic">&ldquo;{breakInfo.custom_reason?.trim()}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Action (Doctor View Only: End Break button) */}
        {isDoctorView && (
          <div className="shrink-0 flex items-center sm:self-center">
            <button
              type="button"
              onClick={onEndBreak}
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white dark:bg-gradient-to-r dark:from-[#10B981] dark:to-[#059669] dark:hover:from-[#059669] dark:hover:to-[#047857] font-bold text-xs sm:text-sm shadow-md shadow-[#15803D]/25 transition-all duration-200 flex items-center justify-center gap-2 border-2 border-[#166534] dark:border-[#34D399] cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resuming Clinic...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span>End Break</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
