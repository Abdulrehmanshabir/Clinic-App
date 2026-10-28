"use client";

import React, { useState } from "react";
import {
  type Appointment,
  type Service,
} from "@/types/database";
import {
  Zap,
  Flame,
  Sparkles,
  Crosshair,
  Syringe,
  Droplets,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { formatClinicTime } from "@/lib/utils";

interface ProceduresSectionProps {
  appointments: Appointment[];
  services: Service[];
  isDoctorView?: boolean;
}

// Fallback icons cycling through a set of icons for any number of procedures
const ICON_POOL = [Zap, Flame, Sparkles, Crosshair, Syringe, Droplets, Stethoscope];

function getProcedureIcon(index: number) {
  return ICON_POOL[index % ICON_POOL.length];
}

export function ProceduresSection({
  appointments,
  services,
}: ProceduresSectionProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

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

      const totalRevenue = svcAppointments.reduce((sum, a) => {
        const price = a.service?.price != null ? Number(a.service.price) : Number(svc.price ?? 0);
        return sum + price;
      }, 0);

      return {
        service: svc,
        appointments: svcAppointments,
        patientCount: svcAppointments.length,
        currentPrice: Number(svc.price ?? 0),
        totalRevenue,
      };
    });
  }, [appointments, activeServices]);

  const activeCategory = selectedServiceId
    ? categorizedData.find((c) => c.service.id === selectedServiceId) || null
    : null;

  return (
    <div className="rounded-3xl border border-[#E8DFD1] dark:border-[#232F42] bg-[#FCFAF6] dark:bg-[#131924] p-5 sm:p-6 aesthetic-card-shadow space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFD1] dark:border-[#232F42]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#1E1915] text-[#FAF7F2] dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4.5 h-4.5 fill-current text-[#D8C5AD] dark:text-[#12100E]" />
          </div>
          <div>
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

        {selectedServiceId && (
          <button
            type="button"
            onClick={() => setSelectedServiceId(null)}
            className="text-xs font-bold text-[#8C7A6B] dark:text-[#94A3B8] hover:text-[#1A120B] dark:hover:text-[#FFFFFF] px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C2535] border-2 border-[#D8C5AD] dark:border-[#2E3C51] transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        )}
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
        <>
          {/* Procedure Cards — live from DB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {categorizedData.map((item, index) => {
              const Icon = getProcedureIcon(index);
              const isSelected = selectedServiceId === item.service.id;

              return (
                <div
                  key={item.service.id}
                  onClick={() => setSelectedServiceId(isSelected ? null : item.service.id)}
                  className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "bg-[#FAF7F2] dark:bg-[#1C2535] border-2 border-[#8C6843] dark:border-[#D4AF37] ring-2 ring-[#8C6843]/20 shadow-md -translate-y-0.5"
                      : "bg-[#FFFFFF] dark:bg-[#171E2B] border border-[#E8DFD1] dark:border-[#232F42] hover:border-[#8C6843]/70 hover:shadow-xs hover:-translate-y-0.5"
                  }`}
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
                    <h4 className="font-serif font-bold text-base sm:text-lg text-[#1A120B] dark:text-[#FFFFFF] leading-snug line-clamp-1">
                      {item.service.name}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                        Rs {item.currentPrice.toLocaleString()}
                      </span>

                      {item.patientCount > 0 && (
                        <span className="text-xs font-mono font-bold text-[#8C6843] dark:text-[#D4AF37]">
                          Rs {item.totalRevenue.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Patients List for Selected Procedure */}
          {activeCategory && (
            <div className="mt-3 rounded-3xl border border-[#E8DFD1] dark:border-[#232F42] bg-[#FCFAF6] dark:bg-[#131924] overflow-hidden aesthetic-card-shadow">
              <div className="px-5 sm:px-7 py-5 border-b border-[#E8DFD1] dark:border-[#232F42] bg-[#FAF7F2] dark:bg-[#1A2230] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-2xl bg-[#1E1915] text-[#FAF7F2] dark:bg-[#D4AF37] dark:text-[#12100E] flex items-center justify-center shadow-xs">
                    {React.createElement(
                      getProcedureIcon(
                        categorizedData.findIndex((c) => c.service.id === activeCategory.service.id)
                      ),
                      { className: "w-4.5 h-4.5" }
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-base sm:text-lg font-serif font-black text-[#1A120B] dark:text-[#F8FAFC]">
                        {activeCategory.service.name}
                      </h4>
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                        Rs {activeCategory.currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs">
                    {activeCategory.appointments.length}{" "}
                    {activeCategory.appointments.length === 1 ? "Patient" : "Patients"} Today
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceId(null)}
                    className="text-xs font-bold text-[#8C7A6B] hover:text-[#1A120B] dark:hover:text-white px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE6D8] border border-[#E8DFD1] transition flex items-center gap-1 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {activeCategory.appointments.length === 0 ? (
                <div className="p-12 text-center text-[#8C7A6B] space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#F4EFE6] border border-[#E9DFD1] flex items-center justify-center text-[#8C6843] mx-auto shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <p className="font-serif font-bold text-base text-[#1A120B] dark:text-white">
                    No patients for {activeCategory.service.name} today
                  </p>
                  <p className="text-xs text-[#8C7A6B]">
                    When an operator assigns this procedure, the patient will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-[#1E1915]">
                    <thead className="bg-[#F4EFE6] text-base sm:text-lg font-black tracking-wider text-[#1A120B] border-b border-[#E8DFD1]">
                      <tr>
                        <th className="px-6 py-4 text-center font-black">Token</th>
                        <th className="px-6 py-4 text-left font-black">Patient Name</th>
                        <th className="px-6 py-4 text-center font-black">Phone</th>
                        <th className="px-6 py-4 text-center font-black">Appointment Time</th>
                        <th className="px-6 py-4 text-center font-black">Status</th>
                        <th className="px-6 py-4 text-center font-black">Procedure Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE6D8]">
                      {activeCategory.appointments.map((app) => {
                        const price =
                          app.service?.price != null
                            ? Number(app.service.price)
                            : activeCategory.currentPrice;

                        return (
                          <tr
                            key={app.id}
                            className="hover:bg-[#F7F3EB]/50 transition-colors duration-150"
                          >
                            {/* Token */}
                            <td className="px-6 py-4 text-center">
                              {app.token ? (
                                <span className="font-mono font-black text-sm text-[#1A120B] bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#E8DFD1] inline-flex items-center justify-center shadow-2xs">
                                  {app.token.token_number}
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-xs text-[#0369A1] bg-[#E0F2FE] px-3 py-1 rounded-xl border border-[#BAE6FD]">
                                  Call Booking
                                </span>
                              )}
                            </td>

                            {/* Patient Name */}
                            <td className="px-6 py-4 text-left">
                              <div className="font-bold text-[#1A120B] text-base font-serif">
                                {app.patient?.full_name}
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-xs text-[#7A634E] font-bold">
                                {app.patient?.phone && !app.patient.phone.startsWith("+92-")
                                  ? app.patient.phone
                                  : "—"}
                              </span>
                            </td>

                            {/* Time */}
                            <td className="px-6 py-4 text-center font-mono font-bold text-xs text-[#1A120B]">
                              {formatClinicTime(app.appointment_time)}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs border ${
                                  app.status === "in_consultation"
                                    ? "bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]"
                                    : app.status === "completed"
                                    ? "bg-[#E6F4EA] text-[#15803D] border-[#BBF7D0]"
                                    : app.status === "called"
                                    ? "bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]"
                                    : "bg-[#FEF3D6] text-[#B45309] border-[#FDE68A]"
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-current" />
                                <span className="capitalize">{app.status.replace("_", " ")}</span>
                              </span>
                            </td>

                            {/* Procedure Fee */}
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono font-bold text-xs sm:text-sm text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs inline-flex items-center justify-center">
                                Rs {price.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
