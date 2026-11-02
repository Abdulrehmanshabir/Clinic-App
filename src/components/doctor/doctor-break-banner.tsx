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
  const isOperatorAlert = !isDoctorView;

  return (
    <div
      className={
        isOperatorAlert
          ? "p-4 sm:px-6 sm:py-4.5 rounded-3xl bg-gradient-to-r from-[#4C1D95] via-[#5B21B6] to-[#7C3AED] dark:from-[#2E1065] dark:via-[#4C1D95] dark:to-[#6D28D9] border-2 border-[#C4B5FD] dark:border-[#A78BFA] shadow-[0_12px_35px_rgba(124,58,237,0.35)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.55)] relative overflow-hidden transition-all duration-200"
          : "p-4 sm:px-6 sm:py-4.5 rounded-3xl bg-gradient-to-r from-[#FCFAF6] via-[#FAF5EE] to-[#FCFAF6] dark:from-[#131B2A] dark:via-[#1A2438] dark:to-[#131B2A] border-2 border-[#8C6843] dark:border-[#D4AF37] shadow-lg shadow-[#8C6843]/10 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-200"
      }
    >
      {isOperatorAlert && (
        <>
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#DDD6FE]/25 blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-12 w-40 h-40 rounded-full bg-[#C4B5FD]/20 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-center gap-3.5">
          {/* Active Break Icon Squircle with live ping */}
          <div
            className={
              isOperatorAlert
                ? "w-12 h-12 rounded-2xl bg-white/20 text-white border border-white/35 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg shadow-black/10 relative"
                : "w-12 h-12 rounded-2xl bg-[#8C6843] text-white dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shrink-0 shadow-sm relative"
            }
          >
            {getIcon("w-6 h-6")}
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping ${
                isOperatorAlert ? "bg-[#DDD6FE]" : "bg-[#E5C158] dark:bg-[#34D399]"
              }`}
            />
            <span
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ring-2 ring-white ${
                isOperatorAlert ? "bg-[#DDD6FE]" : "bg-[#E5C158] dark:bg-[#34D399] dark:ring-[#131B2A]"
              }`}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Status Badge */}
              <span
                className={
                  isOperatorAlert
                    ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#5B21B6] border-2 border-[#C4B5FD] text-[11px] font-black uppercase tracking-wider shadow-sm"
                    : "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#8C6843] border-2 border-[#8C6843] dark:bg-[#0B1120] dark:text-[#CBD5E1] dark:border-2 dark:border-[#334155] text-[11px] font-black uppercase tracking-wider shadow-2xs"
                }
              >
                <PauseCircle
                  className={`w-3.5 h-3.5 ${
                    isOperatorAlert ? "text-[#7C3AED]" : "text-[#8C6843] dark:text-[#94A3B8]"
                  }`}
                />
                {isDoctorView ? "You Are On Break" : "Doctor On Break"}
              </span>

              {/* Break Type Badge */}
              <span
                className={
                  isOperatorAlert
                    ? "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 text-white border-2 border-white/40 backdrop-blur-md text-xs sm:text-sm font-black tracking-tight shadow-sm"
                    : "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8C6843] text-white border-2 border-[#745534] dark:bg-[#D4AF37] dark:text-[#12100E] dark:border-2 dark:border-[#E5C158] text-xs sm:text-sm font-black tracking-tight shadow-sm dark:shadow-[0_4px_16px_rgba(212,175,55,0.25)]"
                }
              >
                {getIcon("w-3.5 h-3.5")}
                <span>{breakInfo.break_type}</span>
              </span>
            </div>

            {/* Doctor Note - ONLY shown if doctor wrote a note */}
            {hasNote && (
              <div
                className={
                  isOperatorAlert
                    ? "flex items-center gap-2 mt-2 text-sm sm:text-base text-white/95 font-semibold bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/25 w-fit"
                    : "flex items-center gap-2 mt-2 text-sm sm:text-base text-[#5C4D3E] dark:text-[#E2E8F0] font-semibold bg-white/70 dark:bg-[#0B1120]/70 px-3.5 py-1.5 rounded-xl border border-[#E8DFD1] dark:border-[#243248] w-fit"
                }
              >
                <MessageSquare
                  className={`w-4 h-4 shrink-0 ${
                    isOperatorAlert ? "text-[#DDD6FE]" : "text-[#8C6843] dark:text-[#D4AF37]"
                  }`}
                />
                <span className="italic">&ldquo;{breakInfo.custom_reason?.trim()}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        {isDoctorView ? (
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
        ) : (
          <div className="shrink-0 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-black uppercase tracking-[0.18em] text-[#EDE9FE]">
            <span className="w-2 h-2 rounded-full bg-[#DDD6FE] animate-pulse" />
            Reception Alert
          </div>
        )}
      </div>
    </div>
  );
}
