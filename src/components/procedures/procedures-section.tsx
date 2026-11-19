"use client";

import React from "react";
import { type Appointment, type Service } from "@/types/database";
import {
  Zap,
  Flame,
  Sparkles,
  Crosshair,
  Syringe,
  Droplets,
  Stethoscope,
} from "lucide-react";

interface ProceduresSectionProps {
  appointments: Appointment[];
  services: Service[];
}

// Fallback icons cycling through a set of icons for any number of procedures
const ICON_POOL = [Zap, Flame, Sparkles, Crosshair, Syringe, Droplets, Stethoscope];

// Six clearly-visible text colors that repeat for any extra procedures
const TITLE_COLOR_POOL = [
  "text-[#B91C1C] dark:text-[#F87171]",
  "text-[#1D4ED8] dark:text-[#60A5FA]",
  "text-[#15803D] dark:text-[#34D399]",
  "text-[#7E22CE] dark:text-[#C084FC]",
  "text-[#C2410C] dark:text-[#FB923C]",
  "text-[#0F766E] dark:text-[#2DD4BF]",
];

function getProcedureIcon(index: number) {
  return ICON_POOL[index % ICON_POOL.length];
}

function getProcedureTitleColor(index: number) {
  return TITLE_COLOR_POOL[index % TITLE_COLOR_POOL.length];
}

export function ProceduresSection({ appointments, services }: ProceduresSectionProps) {
  // Only show active services from DB — no hardcoded list
  const activeServices = React.useMemo(
    () => (services || []).filter((s) => s.is_active !== false),
    [services]
  );

  // Group appointments by service_id — purely DB-driven, no keyword matching
  const categorizedData = React.useMemo(() => {
    return activeServices.map((svc) => {
      const svcAppointments = appointments.filter(
        (a) => a.service_id === svc.id
      );

      // Collected only counts completed procedures, so fees accumulate per
      // card as each patient is completed (e.g. Rs 3,500 + Rs 3,500).
      const totalRevenue = svcAppointments.reduce((sum, a) => {
        if (a.status !== "completed") return sum;
        return sum + (a.custom_amount != null ? Number(a.custom_amount) : 0);
      }, 0);

      return {
        service: svc,
        patientCount: svcAppointments.length,
        totalRevenue,
      };
    });
  }, [appointments, activeServices]);

  return (
    <div className="rounded-3xl border border-[#E8DFD1] dark:border-[#232F42] bg-[#FCFAF6] dark:bg-[#131924] p-5 sm:p-6 aesthetic-card-shadow space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD1] dark:border-[#232F42]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#1E1915] text-[#FAF7F2] dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4.5 h-4.5 fill-current text-[#D8C5AD] dark:text-[#12100E]" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-serif font-black text-[#1A120B] dark:text-[#F8FAFC] tracking-tight">
              Clinical Procedures &amp; Treatment Demands
            </h3>
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
              {activeServices.length} Total Procedures
            </span>
          </div>
        </div>
      </div>

      {activeServices.length === 0 ? (
        <div className="p-10 text-center text-[#8C7A6B] space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#F4EFE6] border border-[#E9DFD1] flex items-center justify-center text-[#8C6843] mx-auto shadow-xs">
            <Stethoscope className="w-5 h-5" />
          </div>
          <p className="font-serif font-bold text-base text-[#1A120B] dark:text-white">
            No Procedures Added Yet
          </p>
          <p className="text-xs text-[#8C7A6B]">
            Add procedures from Procedure Setting to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categorizedData.map((item, index) => {
            const Icon = getProcedureIcon(index);
            const titleColor = getProcedureTitleColor(index);

            return (
              <div
                key={item.service.id}
                className="p-4 rounded-3xl border border-[#E8DFD1] dark:border-[#232F42] bg-[#FFFFFF] dark:bg-[#171E2B] flex flex-col justify-between relative overflow-hidden"
              >
                {/* Header: Icon, Index & Count Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#F4EFE6] dark:bg-[#20293A] border border-[#E9DFD1] dark:border-[#2E3C51] text-[#8C6843] dark:text-[#D4AF37] flex items-center justify-center shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-mono font-bold text-xs text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-2.5 py-1 rounded-lg border border-[#E8DFD1] dark:border-[#2E3C51] shadow-2xs">
                      #{index + 1}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl shadow-2xs inline-flex items-center gap-1.5 ${
                      item.patientCount > 0
                        ? "bg-[#FAF7F2] dark:bg-[#1A2230] border-2 border-[#8C6843] dark:border-[#34D399] text-[#8C6843] dark:text-[#34D399]"
                        : "bg-[#FAF7F2] dark:bg-[#1A2230] border border-[#E8DFD1] dark:border-[#2E3C51] text-[#8C7A6B] dark:text-[#94A3B8]"
                    }`}
                  >
                    {item.patientCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C6843] dark:bg-[#34D399] animate-pulse" />
                    )}
                    <span className="font-mono font-black">{item.patientCount}</span>
                    <span>{item.patientCount === 1 ? "Patient" : "Patients"}</span>
                  </span>
                </div>

                {/* Title & Fee */}
                <div className="space-y-2">
                  <h4 className={`font-serif font-bold text-base sm:text-lg leading-snug line-clamp-1 ${titleColor}`}>
                    {item.service.name}
                  </h4>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#8C6843] dark:text-[#34D399] bg-[#FAF7F2] dark:bg-[#1A2230] px-3 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                      Collected: Rs {item.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
