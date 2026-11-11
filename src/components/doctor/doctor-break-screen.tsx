"use client";

import React, { useEffect, useMemo, useState } from "react";
import { type DoctorBreakInfo } from "@/types/database";
import {
  Coffee,
  Sparkles,
  Utensils,
  Zap,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  PauseCircle,
  BellRing,
  ChevronDown,
} from "lucide-react";

interface DoctorBreakScreenProps {
  breakInfo: DoctorBreakInfo;
  onEndBreak?: () => Promise<void>;
  isLoading?: boolean;
  mode?: "doctor" | "operator";
  onMinimize?: () => void;
}

function getBreakIcon(breakType: string, className: string) {
  switch (breakType) {
    case "Tea Break":
      return <Coffee className={className} />;
    case "Namaz Break":
      return <Sparkles className={className} />;
    case "Lunch Break":
      return <Utensils className={className} />;
    case "Quick Break":
      return <Zap className={className} />;
    default:
      return <Clock className={className} />;
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function DoctorBreakScreen({
  breakInfo,
  onEndBreak,
  isLoading = false,
  mode = "doctor",
  onMinimize,
}: DoctorBreakScreenProps) {
  const isOperator = mode === "operator";
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = isOperator
      ? `Doctor On Break • ${breakInfo.break_type} | Lumière`
      : `On Break • ${breakInfo.break_type} | Lumière`;
    return () => {
      document.title = previousTitle;
    };
  }, [breakInfo.break_type, isOperator]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const startedAtMs = useMemo(() => {
    const parsed = new Date(breakInfo.started_at).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }, [breakInfo.started_at]);

  const elapsedSeconds =
    now && startedAtMs ? Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000)) : 0;

  const hours = pad(Math.floor(elapsedSeconds / 3600));
  const minutes = pad(Math.floor((elapsedSeconds % 3600) / 60));
  const seconds = pad(elapsedSeconds % 60);

  const hasNote = Boolean(breakInfo.custom_reason && breakInfo.custom_reason.trim().length > 0);

  const timerTiles = [
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${breakInfo.break_type} in progress`}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#F6F1E7] dark:bg-[#070D18]"
    >
      {/* Ambient luxury glow layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-luxury-bg absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-[#D8C5AD]/45 blur-3xl dark:bg-[#8C6843]/10" />
        <div className="absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#C4A482]/35 blur-3xl dark:bg-[#D4AF37]/10" />
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl dark:bg-[#0E1626]/80" />
      </div>

      {/* Center card */}
      <main className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-4 py-6 sm:py-10">
        <div className="animate-luxury-card w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border-2 border-[#E2D3BE] bg-[#FCFAF6]/95 px-5 py-8 text-center shadow-[0_30px_80px_-24px_rgba(140,104,67,0.35)] backdrop-blur-xl dark:border-[#243248] dark:bg-[#0E1626]/95 dark:shadow-[0_30px_80px_-24px_rgba(0,0,0,0.85)] sm:rounded-[2.5rem] sm:px-12 sm:py-12">
            {/* Icon medallion */}
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center sm:mb-7">
              <span
                className="absolute inset-0 animate-ping rounded-full bg-[#8C6843]/15 dark:bg-[#D4AF37]/10"
                style={{ animationDuration: "2.8s" }}
              />
              <span className="absolute inset-1.5 rounded-full border border-[#8C6843]/25 dark:border-[#D4AF37]/25" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#A8835A] to-[#6B4E31] text-white shadow-lg shadow-[#8C6843]/30 dark:from-[#D4AF37] dark:to-[#B08F6B] dark:text-[#12100E] dark:shadow-[0_10px_30px_rgba(212,175,55,0.25)]">
                {getBreakIcon(breakInfo.break_type, "h-8 w-8")}
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8C6843] dark:text-[#E5C158] sm:text-[11px]">
              {isOperator ? "Doctor on break" : "Break in progress"}
            </p>
            <h1 className="mt-2.5 font-serif text-3xl font-bold tracking-tight text-[#1A120B] dark:text-white sm:mt-3 sm:text-5xl">
              {breakInfo.break_type}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-semibold text-[#6B5B4A] dark:text-[#94A3B8] sm:text-base">
              {isOperator
                ? "The doctor is on a break. The live queue is paused — please continue assisting waiting patients until the doctor resumes."
                : "The clinic is paused. Reception has been notified — take your time and recharge."}
            </p>

            {/* Live elapsed timer */}
            <div className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-2.5 sm:mt-8 sm:gap-3">
              {timerTiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-2xl border-2 border-[#E2D3BE] bg-white/85 px-2 py-3.5 shadow-sm dark:border-[#243248] dark:bg-[#131B2A] sm:py-4"
                >
                  <div className="font-mono text-3xl font-bold tabular-nums text-[#1A120B] dark:text-white sm:text-4xl">
                    {tile.value}
                  </div>
                  <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#8C7A6B] dark:text-[#64748B] sm:text-[10px]">
                    {tile.label}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-bold text-[#8C7A6B] dark:text-[#64748B] sm:text-xs">
              Started at {breakInfo.started_time || "—"} · Live timer
            </p>

            {/* Optional note for reception */}
            {hasNote && (
              <div className="mx-auto mt-5 flex w-fit max-w-full items-center gap-2 rounded-xl border border-[#E8DFD1] bg-white/75 px-3.5 py-2 text-left dark:border-[#243248] dark:bg-[#0B1120]/70">
                <MessageSquare className="h-4 w-4 shrink-0 text-[#8C6843] dark:text-[#D4AF37]" />
                <span className="text-xs font-semibold italic text-[#5C4D3E] dark:text-[#E2E8F0] sm:text-sm">
                  &ldquo;{breakInfo.custom_reason?.trim()}&rdquo;
                </span>
              </div>
            )}

            {/* Status chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-7 sm:gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#065F46] shadow-sm dark:border-[#34D399]/50 dark:bg-[#022C22] dark:text-[#A7F3D0] sm:text-[11px]">
                <BellRing className="h-3.5 w-3.5" />
                {isOperator ? "Doctor unavailable" : "Reception notified"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#E2D3BE] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#8C6843] shadow-2xs dark:border-[#334155] dark:bg-[#131B2A] dark:text-[#CBD5E1] sm:text-[11px]">
                <PauseCircle className="h-3.5 w-3.5" />
                Live queue paused
              </span>
            </div>

            {/* Action: doctor can end break, operator can only minimize */}
            {isOperator ? (
              <div className="mt-7 sm:mt-8">
                <div className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-[#E2D3BE] bg-white/75 px-4 py-3.5 text-xs font-bold text-[#6B5B4A] dark:border-[#243248] dark:bg-[#131B2A] dark:text-[#CBD5E1] sm:text-sm">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8C6843]/60 dark:bg-[#D4AF37]/60"
                      style={{ animationDuration: "1.8s" }}
                    />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8C6843] dark:bg-[#D4AF37]" />
                  </span>
                  Waiting for the doctor to resume the clinic…
                </div>

                {onMinimize && (
                  <button
                    type="button"
                    onClick={onMinimize}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#D8C5AD] bg-[#FAF7F2] px-6 py-3 text-xs font-bold text-[#5C4D3E] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EAE1D3] active:scale-[0.98] dark:border-[#2D3E58] dark:bg-[#131B2A] dark:text-[#CBD5E1] dark:hover:bg-[#1A2438] sm:text-sm"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>Minimize &amp; Continue Working</span>
                  </button>
                )}
                <p className="mt-3 text-[10px] font-semibold text-[#8C7A6B] dark:text-[#64748B] sm:text-[11px]">
                  Only the doctor can end the break.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEndBreak}
                  disabled={isLoading}
                  className="mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#166534] bg-[#15803D] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#15803D]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#166534] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#34D399] dark:bg-gradient-to-r dark:from-[#10B981] dark:to-[#059669] dark:hover:from-[#059669] dark:hover:to-[#047857] sm:mt-8 sm:py-4 sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Resuming Clinic...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>End Break &amp; Resume Clinic</span>
                    </>
                  )}
                </button>
                <p className="mt-3 text-[10px] font-semibold text-[#8C7A6B] dark:text-[#64748B] sm:text-[11px]">
                  Ending the break reopens the live queue for reception.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
