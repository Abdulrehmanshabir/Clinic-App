"use client";

import React, { useState } from "react";
import { type ActiveSession, type Appointment, type ClinicShift, type Service, type Profile } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatClinicDate, formatClinicTime } from "@/lib/utils";
import {
  Filter,
  Phone,
  PhoneCall,
  UserCheck,
  Search,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { getTodayDateString } from "@/lib/utils";
import { SHIFT_LABELS, getAppointmentShift } from "@/lib/session";
import { fetchAppointmentsForDate, searchAppointments } from "@/lib/actions";

interface AppointmentsPageClientProps {
  initialAppointments: Appointment[];
  clinicDate: string;
  initialActiveSession?: ActiveSession | null;
  services?: Service[];
  doctors?: Profile[];
}

export function AppointmentsPageClient({
  initialAppointments,
  clinicDate,
  initialActiveSession = null,
}: AppointmentsPageClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [filterDate, setFilterDate] = useState<string>(clinicDate);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const isSearching = searchQuery.trim().length > 0;

  // Realtime multi-screen synchronization
  useRealtimeAppointments({
    clinicDate: getTodayDateString(),
    onUpdate: () => {
      router.refresh();
    },
  });

  React.useEffect(() => {
    let cancelled = false;

    if (isSearching) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const res = await searchAppointments(searchQuery);
          if (!cancelled) setAppointments(res.success ? res.data : []);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      }, 350);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    if (filterDate === clinicDate) {
      setAppointments(initialAppointments);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchAppointmentsForDate(filterDate)
      .then((res) => {
        if (!cancelled) setAppointments(res.success ? res.data : []);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSearching, searchQuery, filterDate, clinicDate, initialAppointments]);

  const filteredAppointments = appointments.filter((app) => {
    if (!isSearching && filterDate && app.appointment_date !== filterDate) return false;
    if (filterType === "walk_in" && app.appointment_type !== "walk_in") return false;
    if (filterType === "scheduled" && app.appointment_type !== "scheduled") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = app.patient?.full_name?.toLowerCase().includes(q);
      const phoneMatch = app.patient?.phone?.toLowerCase().includes(q);
      const tokenMatch = app.token?.token_number?.toLowerCase().includes(q);
      const idMatch = app.patient?.patient_number?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !tokenMatch && !idMatch) return false;
    }
    return true;
  });

  const morningAppointments = filteredAppointments.filter(
    (app) => getAppointmentShift(app) === "morning"
  );
  const eveningAppointments = filteredAppointments.filter(
    (app) => getAppointmentShift(app) === "evening"
  );

  const activeShift: ClinicShift | null =
    filterDate === clinicDate ? initialActiveSession?.shift ?? null : null;
  const shiftOrder: ClinicShift[] =
    activeShift === "evening" ? ["evening", "morning"] : ["morning", "evening"];
  const rowsByShift: Record<ClinicShift, Appointment[]> = {
    morning: morningAppointments,
    evening: eveningAppointments,
  };

  const renderShiftTable = (
    shift: ClinicShift,
    rows: Appointment[]
  ) => {
    const isMorning = shift === "morning";
    const Icon = isMorning ? Sun : Moon;

    return (
      <div
        key={shift}
        className="rounded-3xl border border-[#E8DFD1] dark:border-[#232F42] bg-[#FCFAF6] dark:bg-[#131924] overflow-hidden aesthetic-card-shadow"
      >
        <div className="px-7 py-5 border-b border-[#E8DFD1] dark:border-[#232F42] bg-[#FAF7F2] dark:bg-[#1A2230] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl border-2 ${
                isMorning
                  ? "bg-[#FFF7E6] text-[#B45309] border-[#FDE68A]"
                  : "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]"
              }`}
            >
              <Icon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2]">
                {SHIFT_LABELS[shift]} Patients
              </h3>
              <p className="text-xs text-[#8C7A6B] dark:text-[#94A3B8] font-bold">
                {SHIFT_LABELS[shift]} session visit records
              </p>
              {activeShift === shift && (
                <span
                  className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    shift === "evening"
                      ? "bg-gradient-to-r from-[#4C1D95] to-[#7C3AED] text-white border-[#A78BFA] shadow-[0_0_12px_rgba(124,58,237,0.28)]"
                      : "bg-gradient-to-r from-[#B45309] to-[#D97706] text-white border-[#FCD34D] shadow-[0_0_12px_rgba(217,119,6,0.25)]"
                  }`}
                >
                  {shift === "evening" ? (
                    <Moon className="w-3 h-3" />
                  ) : (
                    <Sun className="w-3 h-3" />
                  )}
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      shift === "evening" ? "bg-[#DDD6FE]" : "bg-[#FEF3C7]"
                    }`}
                  />
                  Live Shift
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
              {rows.length} Records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-[#1E1915] dark:text-[#FAF7F2]">
            <thead className="bg-[#F4EFE6] dark:bg-[#1A2230] text-lg font-black tracking-wider text-[#1A120B] dark:text-[#FAF7F2] border-b border-[#E8DFD1] dark:border-[#232F42]">
              <tr>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Token</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Date & Time</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Patient Name</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Phone Number</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Booking Type</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B] dark:text-[#FAF7F2]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE6D8] dark:divide-[#232F42]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-[#8C7A6B] dark:text-[#94A3B8]">
                    <div className="max-w-sm mx-auto space-y-1.5 py-2">
                      <p className="font-bold text-lg text-[#1A120B] dark:text-white">
                        No {SHIFT_LABELS[shift].toLowerCase()} patients found
                      </p>
                      <p className="text-sm text-[#8C7A6B] dark:text-[#94A3B8]">
                        No records matching your search and filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((app) => {
                  const isCallBooking = app.appointment_type === "scheduled";
                  const isWalkIn = app.appointment_type === "walk_in";

                  return (
                    <tr key={app.id} className="hover:bg-[#F7F3EB]/50 dark:hover:bg-[#1E293B]/40 transition-colors duration-150">
                      {/* Token */}
                      <td className="px-6 py-4 text-center font-mono font-bold">
                        {app.token ? (
                          <span className="text-[#1A120B] dark:text-[#FAF7F2] text-base bg-[#F4EFE6] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border border-[#E8DFD1] dark:border-[#2E3C51] inline-block shadow-2xs font-mono font-black">
                            {app.token.token_number}
                          </span>
                        ) : (
                          <span className="text-base text-[#A89887] dark:text-[#64748B] font-medium italic">No Token</span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4 text-center text-[#1A120B] dark:text-[#FAF7F2]">
                        <div className="font-bold text-base text-[#1A120B] dark:text-[#FAF7F2]">{formatClinicDate(app.appointment_date)}</div>
                        <div className="text-sm text-[#8C7A6B] dark:text-[#94A3B8] font-mono mt-0.5 font-bold">
                          {formatClinicTime(app.appointment_time)}
                        </div>
                      </td>

                      {/* Patient Name */}
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-[#1A120B] dark:text-[#FAF7F2] text-base">{app.patient?.full_name}</div>
                        <div className="text-xs text-[#8C7A6B] dark:text-[#94A3B8] font-mono font-bold">
                          {app.patient?.patient_number}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-6 py-4 text-center">
                        {app.patient?.phone && !app.patient.phone.startsWith("+92-") ? (
                          <div className="inline-flex items-center gap-1.5 text-[#1A120B] dark:text-[#FAF7F2] font-mono text-base font-bold bg-[#F4EFE6] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border border-[#E9DFD1] dark:border-[#2E3C51]">
                            <Phone className="w-4 h-4 text-[#A8835A] dark:text-[#D4AF37]" />
                            {app.patient.phone}
                          </div>
                        ) : app.patient?.phone ? (
                          <span className="text-[#1A120B] dark:text-[#FAF7F2] font-mono text-base font-bold">{app.patient.phone}</span>
                        ) : (
                          <span className="text-[#A89887] dark:text-[#64748B] text-base font-medium">—</span>
                        )}
                      </td>

                      {/* Booking Type */}
                      <td className="px-6 py-4 text-center">
                        {isWalkIn ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-[#FAF7F2] dark:bg-[#1A2230] text-[#6B4E31] dark:text-[#D4AF37] border border-[#D8C5AD] dark:border-[#2E3C51]">
                            <UserCheck className="w-4 h-4 text-[#A8835A] dark:text-[#D4AF37]" />
                            Walk-In
                          </span>
                        ) : isCallBooking ? (
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-[#E0F2FE] dark:bg-[#0C2D48] text-[#0369A1] dark:text-[#38BDF8] border border-[#BAE6FD] dark:border-[#0369A1]">
                            <PhoneCall className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" />
                            Call / Online
                          </span>
                        ) : (
                          <span className="text-sm text-[#8C7A6B] dark:text-[#94A3B8] capitalize font-medium">
                            {app.appointment_type.replace("_", " ")}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5 text-center">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] dark:bg-[#131924] border border-[#E8DFD1] dark:border-[#232F42] aesthetic-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120B] dark:text-[#FFFFFF] tracking-tight">
            Patient Visit Records
          </h2>
          <p className="text-sm sm:text-base text-[#8C6843] dark:text-[#E5C158] font-bold mt-1">
            Today&apos;s patient records are shown by default. Search to find previous patients.
          </p>
        </div>

        {/* Search & Date Filters with 2px outlines in both Light & Dark modes */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2.5 w-full sm:w-64 bg-[#FAF7F2] dark:bg-[#1A2230] px-4 py-2.5 rounded-2xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-xs transition-colors">
            <Search className="w-4 h-4 text-[#8C6843] dark:text-[#34D399] shrink-0" />
            <input
              type="text"
              placeholder="Search today or previous patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2] placeholder-[#8C7A6B] dark:placeholder-[#64748B] outline-none"
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-[#8C6843] dark:text-[#34D399] shrink-0" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-bold text-[#8C7A6B] hover:text-[#1A120B] dark:text-[#94A3B8] dark:hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2.5 bg-[#FAF7F2] dark:bg-[#1A2230] px-4 py-2.5 rounded-2xl border-2 border-[#8C6843] dark:border-[#34D399] text-xs text-[#1A120B] dark:text-[#FAF7F2] shadow-xs transition-colors">
            <Filter className="w-3.5 h-3.5 text-[#8C6843] dark:text-[#34D399] shrink-0" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setSearchQuery("");
                setFilterDate(e.target.value || clinicDate);
              }}
              className="bg-transparent text-xs text-[#1A120B] dark:text-[#FAF7F2] font-semibold outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            />
            {filterDate !== clinicDate && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterDate(clinicDate);
                }}
                className="text-[10px] font-bold text-[#B91C1C] dark:text-[#F87171] hover:underline ml-1"
              >
                Today
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center rounded-2xl bg-[#F4EFE6] dark:bg-[#131924] p-1.5 border border-[#E9DFD1] dark:border-[#2E3C51] text-sm">
            {[
              { id: "all", label: "All Types" },
              { id: "walk_in", label: "Walk-In" },
              { id: "scheduled", label: "Call / Online" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-4 py-2 rounded-xl font-black text-sm transition-all duration-150 ${
                  filterType === t.id
                    ? "bg-[#1E1915] text-[#FAF7F2] dark:bg-gradient-to-r dark:from-[#D4AF37] dark:to-[#C5A059] dark:text-[#12100E] shadow-xs"
                    : "text-[#1A120B] dark:text-[#FAF7F2] hover:text-[#1E1915] dark:hover:text-white hover:bg-[#EFE6D8]/80 dark:hover:bg-[#1A2230]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active session table first, then the other session */}
      {shiftOrder.map((shift) => renderShiftTable(shift, rowsByShift[shift]))}
    </div>
  );
}
