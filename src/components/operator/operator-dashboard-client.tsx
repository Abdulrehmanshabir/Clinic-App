"use client";

import React, { useState } from "react";
import { type Appointment, type QueueSummary, type Profile, type Service, type ClinicSettings, type DoctorBreakInfo } from "@/types/database";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { DoctorBreakBanner } from "@/components/doctor/doctor-break-banner";
import { quickBookToken, bookCallAppointment, checkInCallAppointment, updateAppointmentStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { useRouter } from "next/navigation";
import { ConsultationModal } from "@/components/doctor/consultation-modal";
import {
  Users,
  Clock,
  Stethoscope,
  CheckCircle2,
  Ticket,
  UserX,
  RotateCcw,
  PhoneCall,
  Phone,
  Calendar,
  LogIn,
  Printer,
  MapPin,
  Eye,
  FileEdit,
  ChevronDown,
} from "lucide-react";
import { formatClinicTime } from "@/lib/utils";

interface OperatorDashboardClientProps {
  initialAppointments: Appointment[];
  summary: QueueSummary;
  clinicDate: string;
  services: Service[];
  doctors: Profile[];
  operatorProfile: Profile | null;
  clinicSettings?: ClinicSettings | null;
  initialDoctorBreak?: DoctorBreakInfo | null;
}

export function OperatorDashboardClient({
  initialAppointments,
  clinicDate,
  clinicSettings,
  initialDoctorBreak,
  services = [],
}: OperatorDashboardClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Doctor Break state for Receptionist view
  const [doctorBreak, setDoctorBreakState] = useState<DoctorBreakInfo | null>(initialDoctorBreak || null);

  React.useEffect(() => {
    setDoctorBreakState(initialDoctorBreak || null);
  }, [initialDoctorBreak]);

  // Success Card states
  const [createdWalkInToken, setCreatedWalkInToken] = useState<{
    token_num: string;
    queue_pos: number;
    patient_name: string;
    time: string;
    phone?: string;
  } | null>(null);

  const [createdCallReservation, setCreatedCallReservation] = useState<{
    patient_name: string;
    phone: string;
    time: string;
    date: string;
  } | null>(null);

  // Form states for walk-in token
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [walkInServiceId, setWalkInServiceId] = useState("");
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Form states for call appointment
  const [callName, setCallName] = useState("");
  const [callPhone, setCallPhone] = useState("");
  const [callServiceId, setCallServiceId] = useState("");
  const [callDate, setCallDate] = useState(clinicDate);
  const [callTime, setCallTime] = useState("18:00");
  const [callHour, setCallHour] = useState("06");
  const [callMinute, setCallMinute] = useState("00");
  const [callPeriod, setCallPeriod] = useState<"AM" | "PM">("PM");
  const [callNotes, setCallNotes] = useState("");
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  const canonicalServices = React.useMemo(() => {
    const targetOrder = [
      "Laser Hair",
      "Cauter/CRYO",
      "Microneedling/PRP",
      "Laser Co2/Q",
      "Injections (Filler, Botox, Whitening)",
      "Hydrafacial",
      "Other Procedures",
    ];
    const ordered: Service[] = [];
    for (const name of targetOrder) {
      const match = (services || []).find((s) => s.name === name);
      if (match) ordered.push(match);
    }
    for (const s of services || []) {
      if (s.is_active !== false && !ordered.find((x) => x.id === s.id)) {
        ordered.push(s);
      }
    }
    return ordered;
  }, [services]);

  const selectedWalkInService = canonicalServices.find((s) => s.id === walkInServiceId);
  const selectedCallService = canonicalServices.find((s) => s.id === callServiceId);

  const hourInputRef = React.useRef<HTMLInputElement>(null);
  const minInputRef = React.useRef<HTMLInputElement>(null);

  const updateCallTimeParts = (h: string, m: string, p: "AM" | "PM") => {
    let hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) hourNum = 12;
    if (p === "AM") {
      if (hourNum === 12) hourNum = 0;
    } else {
      if (hourNum !== 12) hourNum += 12;
    }
    const formatted = `${String(hourNum).padStart(2, "0")}:${m || "00"}`;
    setCallTime(formatted);
  };

  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setCallHour("");
      return;
    }
    const num = parseInt(val, 10);
    if (num > 12) {
      const clamped = "12";
      setCallHour(clamped);
      updateCallTimeParts(clamped, callMinute || "00", callPeriod);
      minInputRef.current?.focus();
      return;
    }
    if (val.length === 2 || num >= 2) {
      const formatted = String(num).padStart(2, "0");
      setCallHour(formatted);
      updateCallTimeParts(formatted, callMinute || "00", callPeriod);
      minInputRef.current?.focus();
    } else {
      setCallHour(val);
      updateCallTimeParts(String(num).padStart(2, "0"), callMinute || "00", callPeriod);
    }
  };

  const handleHourBlur = () => {
    let num = parseInt(callHour, 10);
    if (isNaN(num) || num < 1) num = 12;
    if (num > 12) num = 12;
    const formatted = String(num).padStart(2, "0");
    setCallHour(formatted);
    updateCallTimeParts(formatted, callMinute || "00", callPeriod);
  };

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let num = parseInt(callHour, 10) || 12;
      num = num >= 12 ? 1 : num + 1;
      const formatted = String(num).padStart(2, "0");
      setCallHour(formatted);
      updateCallTimeParts(formatted, callMinute || "00", callPeriod);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      let num = parseInt(callHour, 10) || 12;
      num = num <= 1 ? 12 : num - 1;
      const formatted = String(num).padStart(2, "0");
      setCallHour(formatted);
      updateCallTimeParts(formatted, callMinute || "00", callPeriod);
    } else if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      handlePeriodChange("AM");
    } else if (e.key.toLowerCase() === "p") {
      e.preventDefault();
      handlePeriodChange("PM");
    }
  };

  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      setCallMinute("");
      return;
    }
    const num = parseInt(val, 10);
    if (num > 59) {
      setCallMinute("59");
      updateCallTimeParts(callHour || "12", "59", callPeriod);
      return;
    }
    if (val.length === 2) {
      const formatted = String(num).padStart(2, "0");
      setCallMinute(formatted);
      updateCallTimeParts(callHour || "12", formatted, callPeriod);
    } else {
      setCallMinute(val);
      updateCallTimeParts(callHour || "12", String(num).padStart(2, "0"), callPeriod);
    }
  };

  const handleMinuteBlur = () => {
    let num = parseInt(callMinute, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 59) num = 59;
    const formatted = String(num).padStart(2, "0");
    setCallMinute(formatted);
    updateCallTimeParts(callHour || "12", formatted, callPeriod);
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      let num = parseInt(callMinute, 10) || 0;
      num = num >= 59 ? 0 : num + 1;
      const formatted = String(num).padStart(2, "0");
      setCallMinute(formatted);
      updateCallTimeParts(callHour || "12", formatted, callPeriod);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      let num = parseInt(callMinute, 10) || 0;
      num = num <= 0 ? 59 : num - 1;
      const formatted = String(num).padStart(2, "0");
      setCallMinute(formatted);
      updateCallTimeParts(callHour || "12", formatted, callPeriod);
    } else if (e.key === "Backspace" && !callMinute) {
      hourInputRef.current?.focus();
    } else if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      handlePeriodChange("AM");
    } else if (e.key.toLowerCase() === "p") {
      e.preventDefault();
      handlePeriodChange("PM");
    }
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setCallPeriod(newPeriod);
    updateCallTimeParts(callHour || "12", callMinute || "00", newPeriod);
  };

  // Sync state with server props
  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  // Supabase Realtime synchronization
  useRealtimeAppointments({
    clinicDate,
    onUpdate: () => {
      router.refresh();
    },
  });

  // Memoized live summary calculations for maximum performance & 0 lag
  const summary: QueueSummary = React.useMemo(() => {
    let waiting = 0;
    let called = 0;
    let in_consultation = 0;
    let completed = 0;
    let cancelled = 0;
    let no_show = 0;

    for (let i = 0; i < appointments.length; i++) {
      const a = appointments[i];
      if (a.status === "waiting" && a.token != null) waiting++;
      else if (a.status === "called" && a.token != null) called++;
      else if (a.status === "in_consultation") in_consultation++;
      else if (a.status === "completed") completed++;
      else if (a.status === "cancelled") cancelled++;
      else if (a.status === "no_show") no_show++;
    }

    return {
      total: appointments.length,
      waiting,
      called,
      in_consultation,
      completed,
      cancelled,
      no_show,
    };
  }, [appointments]);

  const callBookingsCount = React.useMemo(() => {
    return appointments.filter(
      (a) => a.appointment_type === "scheduled" && a.token == null && a.status !== "completed" && a.status !== "no_show"
    ).length;
  }, [appointments]);

  const nextEstimatedToken = React.useMemo(() => {
    return `P-${String(
      appointments.filter((a) => a.token != null).length + 1
    ).padStart(3, "0")}`;
  }, [appointments]);

  // 1. Handle Walk-in Token Booking (Immediate physical arrival)
  const handleQuickBookWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      error("Name Required", "Please enter patient name");
      return;
    }

    setIsSubmittingWalkIn(true);
    try {
      const res = await quickBookToken({
        full_name: patientName.trim(),
        phone: patientPhone.trim() || undefined,
        appointment_date: clinicDate,
        service_id: walkInServiceId || undefined,
      });

      if (res.success && res.data) {
        setCreatedWalkInToken({
          token_num: res.data.token?.token_num || "P-001",
          queue_pos: res.data.token?.queue_pos || 1,
          patient_name: patientName.trim(),
          time: res.data.appointment_time,
          phone: patientPhone.trim() || undefined,
        });
        success(
          "Walk-In Token Issued! 🎉",
          `Assigned ${res.data.token?.token_num || "Token"} to ${patientName.trim()}`
        );
        setPatientName("");
        setPatientPhone("");
        setWalkInServiceId("");
        router.refresh();
      } else {
        error("Booking Failed", res.error || "Could not issue token");
      }
    } catch {
      error("Error", "An unexpected error occurred while booking token");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // 2. Handle Advance Call Booking (Phone reservation)
  const handleBookCallAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callName.trim()) {
      error("Name Required", "Please enter patient name");
      return;
    }
    if (!callPhone.trim()) {
      error("Phone Required", "Please enter phone number for call bookings");
      return;
    }

    setIsSubmittingCall(true);
    try {
      const res = await bookCallAppointment({
        full_name: callName.trim(),
        phone: callPhone.trim(),
        appointment_date: callDate || clinicDate,
        appointment_time: callTime,
        notes: callNotes.trim() || undefined,
        service_id: callServiceId || undefined,
      });

      if (res.success && res.data) {
        setCreatedCallReservation({
          patient_name: callName.trim(),
          phone: callPhone.trim(),
          time: callTime,
          date: callDate || clinicDate,
        });
        success(
          "Call Appointment Reserved! 📞",
          `Reserved for ${callName.trim()} on ${callDate || clinicDate} at ${formatClinicTime(callTime)}`
        );
        setCallName("");
        setCallPhone("");
        setCallServiceId("");
        setCallDate(clinicDate);
        setCallHour("06");
        setCallMinute("00");
        setCallPeriod("PM");
        setCallTime("18:00");
        setCallNotes("");
        router.refresh();
      } else {
        error("Call Booking Failed", res.error || "Could not reserve appointment");
      }
    } catch {
      error("Error", "An unexpected error occurred");
    } finally {
      setIsSubmittingCall(false);
    }
  };

  // 3. Handle Physical Arrival Check-In for Call Booking (Issue active Token)
  const handleCheckInCallPatient = async (appointmentId: string, patientName?: string) => {
    setLoadingAction(appointmentId);
    try {
      const res = await checkInCallAppointment(appointmentId);
      if (res.success && res.data) {
        success(
          "Patient Checked-In! 🎟️",
          `${patientName || "Patient"} arrived! Issued Token: ${res.data.token_number} (Added to Doctor Queue)`
        );
        router.refresh();
      } else {
        error("Check-In Failed", res.error || "Could not check in patient");
      }
    } catch {
      error("Error", "An unexpected error occurred");
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Handle Mark Absent / Skip
  const handleMarkAbsent = async (appointmentId: string, patientName?: string) => {
    setLoadingAction(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "no_show" } : a))
    );

    try {
      const res = await updateAppointmentStatus(appointmentId, "no_show");
      if (res.success) {
        success("Patient Marked Absent", `${patientName || "Patient"} marked as Absent (No Show)`);
        router.refresh();
      } else {
        error("Action Failed", res.error);
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Handle Re-Queue (Arrived later)
  const handleReQueue = async (appointmentId: string, patientName?: string) => {
    setLoadingAction(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "waiting" } : a))
    );

    try {
      const res = await updateAppointmentStatus(appointmentId, "waiting");
      if (res.success) {
        success("Patient Re-Queued", `${patientName || "Patient"} returned to Waiting queue`);
        router.refresh();
      } else {
        error("Action Failed", res.error);
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredList = React.useMemo(() => {
    return appointments.filter((a) => {
      if (filter === "active") return (a.status === "waiting" || a.status === "called" || a.status === "in_consultation") && a.token != null;
      if (filter === "call_bookings") return a.appointment_type === "scheduled" && a.token == null && a.status !== "no_show" && a.status !== "completed";
      if (filter === "completed") return a.status === "completed";
      if (filter === "no_show") return a.status === "no_show";
      return true;
    });
  }, [appointments, filter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Header - Clean Luxury Banner */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120B] dark:text-[#FFFFFF] tracking-tight">
            Front Desk & Patient Reception
          </h2>
          <p className="text-sm sm:text-base text-[#8C6843] dark:text-[#E5C158] font-bold mt-1">
            Manage walk-in tokens, call bookings, and patient queue in real-time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Button 1: Walk-In Token */}
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#8C6843] hover:bg-[#785838] text-white dark:bg-[#D4AF37] dark:hover:bg-[#C5A059] dark:text-[#12100E] font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 border-2 border-[#745534] dark:border-[#E5C158] cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Ticket className="w-4.5 h-4.5 text-white dark:text-[#12100E]" />
            <span>+ Walk-In Token</span>
          </button>

          {/* Button 2: Call Appointment */}
          <button
            onClick={() => setIsCallModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#8C6843] dark:bg-[#1A2438] dark:hover:bg-[#223048] dark:text-[#E2E8F0] border-2 border-[#8C6843] dark:border-[#334155] dark:hover:border-[#D4AF37]/50 font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <PhoneCall className="w-4.5 h-4.5 text-[#8C6843] dark:text-[#D4AF37]" />
            <span>+ Book Call Appointment</span>
          </button>
        </div>
      </div>

      {/* Doctor Break Alert Banner for Operator */}
      {doctorBreak?.on_break && (
        <DoctorBreakBanner
          breakInfo={doctorBreak}
          onEndBreak={async () => {}}
          isLoading={false}
          isDoctorView={false}
        />
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Today Total Patients"
          value={summary.total}
          icon={Users}
          variant="bronze"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <StatCard
          title="Active Waiting"
          value={summary.waiting}
          icon={Clock}
          variant="rose"
          active={filter === "active"}
          onClick={() => setFilter("active")}
        />
        <StatCard
          title="Call Bookings"
          value={callBookingsCount}
          icon={PhoneCall}
          variant="sky"
          active={filter === "call_bookings"}
          onClick={() => setFilter("call_bookings")}
        />
        <StatCard
          title="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          variant="emerald"
          active={filter === "completed"}
          onClick={() => setFilter("completed")}
        />
      </div>

      {/* Live Reception Queue Table */}
      <div className="rounded-3xl border border-[#E8DFD1] bg-[#FCFAF6] overflow-hidden aesthetic-card-shadow">
        <div className="px-7 py-5 border-b border-[#E8DFD1] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2]">
              All Today&apos;s Patients
            </h3>
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
              {filteredList.length} Records
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-[#F4EFE6] dark:bg-[#1A2234] rounded-2xl border border-[#E9DFD1] dark:border-[#2D3E58] overflow-x-auto max-w-full custom-scrollbar">
            {[
              { id: "all", label: "All Patients" },
              { id: "active", label: "Active Queue" },
              { id: "call_bookings", label: `Call Bookings (${callBookingsCount})` },
              { id: "no_show", label: "Not Present" },
              { id: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-150 ${
                  filter === f.id
                    ? "bg-[#1E1915] text-[#FAF7F2] shadow-sm shadow-[#1E1915]/10"
                    : "text-[#1A120B] dark:text-[#FAF7F2] hover:text-[#1E1915] hover:bg-[#EFE6D8]/80 dark:hover:bg-[#20293A]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-[#1E1915]">
            <thead className="bg-[#F4EFE6] text-lg font-black tracking-wider text-[#1A120B] border-b border-[#E8DFD1]">
              <tr>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Token</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Patient Name</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Procedure & Price</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Phone Number</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Reserved Time</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Status</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE6D8]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-[#8C6843] dark:text-[#E5C158]">
                    <div className="max-w-sm mx-auto space-y-1.5 py-2">
                      <p className="font-bold text-lg text-[#1A120B] dark:text-[#FFFFFF]">No patients found</p>
                      <p className="text-base text-[#8C6843] dark:text-[#E5C158] font-bold">No records matching the selected queue filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-[#F7F3EB]/50 transition-colors duration-150 ${
                      app.status === "in_consultation"
                        ? "bg-[#FAF5FF]"
                        : app.status === "no_show"
                        ? "bg-[#FEF2F2]/50"
                        : app.appointment_type === "scheduled" && !app.token
                        ? "bg-[#F0F9FF]/40"
                        : ""
                    }`}
                  >
                    {/* Token / Type */}
                    <td className="px-6 py-4 text-center">
                      {app.token ? (
                        <span className="font-mono font-black text-base text-[#1A120B] bg-[#F4EFE6] px-3.5 py-1.5 rounded-xl border border-[#E8DFD1] inline-block shadow-2xs">
                          {app.token.token_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-base font-bold font-mono">
                          <PhoneCall className="w-4 h-4" />
                          Call Booking
                        </span>
                      )}
                    </td>

                    {/* Patient Name */}
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-[#1A120B] text-base">
                        {app.patient?.full_name}
                      </div>
                    </td>

                    {/* Procedure & Price */}
                    <td className="px-6 py-4 text-center">
                      {app.service ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-xs px-2.5 py-1 rounded-xl bg-[#FAF7F2] dark:bg-[#1E293B] border border-[#E8DFD1] dark:border-[#334155] text-[#1A120B] dark:text-white">
                            {app.service.name}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-[#15803D] dark:text-[#34D399] mt-0.5">
                            Rs {Number(app.service.price).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#A89887] font-medium">—</span>
                      )}
                    </td>

                    {/* Phone Number */}
                    <td className="px-6 py-4 text-center">
                      {app.patient?.phone && !app.patient.phone.startsWith("+92-") ? (
                        <div className="inline-flex items-center gap-1.5 text-[#1A120B] font-mono text-base font-bold bg-[#F4EFE6] px-3.5 py-1.5 rounded-xl border border-[#E9DFD1]">
                          <Phone className="w-4 h-4 text-[#A8835A]" />
                          {app.patient.phone}
                        </div>
                      ) : app.patient?.phone ? (
                        <span className="text-[#1A120B] font-mono text-base font-bold">{app.patient.phone}</span>
                      ) : (
                        <span className="text-[#A89887] text-base font-medium">—</span>
                      )}
                    </td>

                    {/* Slot Time */}
                    <td className="px-6 py-4 text-center">
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#E9DFD1] text-base font-bold text-[#1A120B] inline-flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-4 h-4 text-[#A8835A]" />
                        {formatClinicTime(app.appointment_time)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {app.token ? (
                        <StatusBadge status={app.status} />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2230] text-[#0284C7] dark:text-[#38BDF8] border-2 border-[#0284C7] dark:border-[#38BDF8] text-xs font-black shadow-2xs whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8] animate-pulse" />
                          Awaiting Arrival
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center space-x-2">
                      {/* Call Booking not yet checked in -> Show Check-In & Give Token button */}
                      {!app.token && app.status !== "no_show" && app.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => handleCheckInCallPatient(app.id, app.patient?.full_name)}
                          disabled={loadingAction === app.id}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5 border border-[#2B1E14]"
                        >
                          <LogIn className="w-3.5 h-3.5 text-[#D8C5AD]" />
                          Arrived (Give Token)
                        </button>
                      )}

                      {/* If patient is waiting with token, allow marking absent */}
                      {app.token && (app.status === "waiting" || app.status === "called") && (
                        <button
                          type="button"
                          onClick={() => handleMarkAbsent(app.id, app.patient?.full_name)}
                          disabled={loadingAction === app.id}
                          className="px-3 py-1.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                          title="Patient is not present"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Skip / Absent
                        </button>
                      )}

                      {/* If patient is absent / no_show, allow re-queuing */}
                      {app.status === "no_show" && (
                        <button
                          type="button"
                          onClick={() => handleReQueue(app.id, app.patient?.full_name)}
                          disabled={loadingAction === app.id}
                          className="px-3 py-1.5 rounded-xl bg-[#FFF9EE] hover:bg-[#FEF3D6] text-[#B45309] border border-[#FDE68A] text-xs font-bold transition inline-flex items-center gap-1 shadow-2xs"
                          title="Patient arrived later"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Re-Queue
                        </button>
                      )}

                      {/* If in consultation */}
                      {app.status === "in_consultation" && (
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#7E22CE] px-3 py-1.5 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] inline-flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" /> Inside Dr Room
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppointmentForNotes(app);
                              setIsNotesModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#1A120B] border border-[#D8C5AD] transition shadow-2xs cursor-pointer"
                            title="Notes"
                          >
                            <FileEdit className="w-4 h-4 text-[#A8835A]" />
                          </button>
                        </div>
                      )}

                      {/* If completed */}
                      {app.status === "completed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentForNotes(app);
                            setIsNotesModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#1A120B] border border-[#D8C5AD] text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="View Doctor Notes & Follow-Up Date"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#A8835A]" />
                          <span>View Notes</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Walk-In Quick Token Issue */}
      <Modal
        isOpen={isWalkInModalOpen}
        onClose={() => {
          setCreatedWalkInToken(null);
          setIsWalkInModalOpen(false);
        }}
        hideDefaultHeader={true}
        maxWidth="md"
      >
        {createdWalkInToken ? (
          <div className="p-5 text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] text-[#15803D] mx-auto flex items-center justify-center border border-[#BBF7D0] shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-serif font-black text-[#1A120B]">Patient Added to Doctor Queue</h4>
              <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">Official token slip generated successfully.</p>
            </div>

            {/* Printable Aesthetic Token Slip Card */}
            <div
              id="printable-slip"
              className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative"
            >
              <div className="text-center border-b border-dashed border-[#D8C5AD] pb-2.5">
                <h5 className="font-serif font-black text-base tracking-wider text-[#1A120B] uppercase">
                  {clinicSettings?.clinic_name || "Glow Derm"}
                </h5>
                <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">
                  {clinicSettings?.tagline || "Expert Laser and Skin Clinic"}
                </p>
                <p className="text-xs sm:text-sm text-[#1A120B] font-mono font-black mt-1">{clinicDate}</p>
              </div>

              <div className="text-center my-2.5">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#A8835A] block mb-0.5">
                  Your Token Number
                </span>
                <span className="text-3xl sm:text-4xl font-mono font-black text-[#1A120B] tracking-widest block py-0.5">
                  {createdWalkInToken.token_num}
                </span>
              </div>

              <div className="border-t border-dashed border-[#D8C5AD] pt-3 space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Patient Name:</span>
                  <span className="font-black text-[#1A120B] text-base sm:text-lg font-serif">{createdWalkInToken.patient_name}</span>
                </div>
                {createdWalkInToken.phone && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs sm:text-sm text-[#1A120B] font-black">Phone Number:</span>
                    <span className="font-black font-mono text-sm sm:text-base text-[#1A120B]">{createdWalkInToken.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Slot Time:</span>
                  <span className="text-sm sm:text-base text-[#1A120B] font-mono font-black">{formatClinicTime(createdWalkInToken.time)}</span>
                </div>
              </div>

              {/* Dynamic Clinic Contact & Hours from Settings */}
              {(clinicSettings?.phone || clinicSettings?.address || clinicSettings?.opening_time || clinicSettings?.closing_time) && (
                <div className="mt-3 pt-2.5 border-t border-dashed border-[#D8C5AD] space-y-1 text-[11px] text-[#4A3522]">
                  {clinicSettings.phone && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <Phone className="w-3 h-3 text-[#A8835A]" />
                      <span className="font-mono">{clinicSettings.phone}</span>
                    </div>
                  )}
                  {clinicSettings.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-[#A8835A] shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{clinicSettings.address}</span>
                    </div>
                  )}
                  {(clinicSettings?.opening_time || clinicSettings?.closing_time) && (
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3 h-3 text-[#A8835A] shrink-0" />
                      <span className="font-mono text-[10px]">
                        Hours: {clinicSettings.opening_time ? formatClinicTime(clinicSettings.opening_time) : "--:--"} - {clinicSettings.closing_time ? formatClinicTime(clinicSettings.closing_time) : "--:--"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2.5 pt-2 border-t border-[#EFE6D8] text-center text-[11px] sm:text-xs text-[#1A120B] font-black italic tracking-tight whitespace-nowrap">
                Please wait comfortably until your number is called.
              </div>
            </div>

            <div className="pt-1.5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-2xl bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] text-xs font-bold transition flex items-center gap-2 border border-[#E9DFD1]"
              >
                <Printer className="w-4 h-4 text-[#A8835A]" />
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedWalkInToken(null);
                  setIsWalkInModalOpen(false);
                }}
                className="px-6 py-2.5 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] text-xs font-bold transition shadow-md"
              >
                Done & Return
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsWalkInModalOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg text-[#8C7A6B] hover:text-[#1A120B] hover:bg-[#EAE1D3] transition"
            >
              <span className="text-sm font-bold leading-none">✕</span>
            </button>

            {/* Header: Aesthetic Clinic Branding (Matching Slip Card Header) */}
            <div className="text-center border-b border-dashed border-[#D8C5AD] pb-2.5">
              <h5 className="font-serif font-black text-base tracking-wider text-[#1A120B] uppercase">
                {clinicSettings?.clinic_name || "Glow Derm"}
              </h5>
              <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">
                {clinicSettings?.tagline || "Expert Laser and Skin Clinic"}
              </p>
              <p className="text-xs sm:text-sm text-[#1A120B] font-mono font-black mt-1">{clinicDate}</p>
            </div>

            {/* Form Body: Matching Slip Card Style */}
            <form onSubmit={handleQuickBookWalkIn}>
              <div className="py-2.5 space-y-3.5 max-w-[350px] mx-auto w-full">
                {/* Next In Line Token (Matching Slip Number Display) */}
                <div className="text-center py-2 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#D8C5AD]">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#A8835A] block mb-0.5">
                    Next In Line Token
                  </span>
                  <span className="text-3xl sm:text-4xl font-mono font-black text-[#1A120B] tracking-widest block py-0.5">
                    {nextEstimatedToken}
                  </span>
                </div>

                {/* Patient Name Input */}
                <div className="border-t border-dashed border-[#D8C5AD] pt-3">
                  <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs"
                  />
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold font-mono transition shadow-2xs"
                  />
                </div>

                {/* Procedure / Treatment Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-3 mr-1">
                    <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158]">
                      Procedure / Treatment
                    </label>
                    {selectedWalkInService && (
                      <span className="font-mono font-black text-xs text-[#15803D] bg-[#E6F4EA] px-2.5 py-0.5 rounded-lg border border-[#BBF7D0]">
                        Rs {Number(selectedWalkInService.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={walkInServiceId}
                      onChange={(e) => setWalkInServiceId(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2234] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-xs sm:text-sm font-bold transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="">Select Procedure (Optional)</option>
                      {canonicalServices.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} — Rs {Number(svc.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8C6843] dark:text-[#E5C158] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Footer: Cancel & Issue Token */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-[#D8C5AD] flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => setIsWalkInModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] text-xs font-bold transition border border-[#E9DFD1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="px-7 py-2.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs shadow-md transition flex items-center gap-2.5 disabled:opacity-50 border border-[#2B1E14]"
                >
                  <Ticket className="w-4 h-4 text-[#D8C5AD]" />
                  {isSubmittingWalkIn ? "Issuing..." : "Issue Token"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal 2: Book Call / Phone Appointment */}
      {/* Modal 2: Book Call / Phone Appointment */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => {
          setCreatedCallReservation(null);
          setIsCallModalOpen(false);
        }}
        hideDefaultHeader={true}
        maxWidth="md"
      >
        {createdCallReservation ? (
          <div className="p-5 text-center py-4 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] text-[#0369A1] mx-auto flex items-center justify-center border border-[#BAE6FD] shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-serif font-black text-[#1A120B]">Phone Slot Reserved</h4>
              <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">Appointment reserved successfully.</p>
            </div>

            {/* Aesthetic Confirmation Slip Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative">
              <div className="text-center border-b border-dashed border-[#D8C5AD] pb-2.5">
                <h5 className="font-serif font-black text-base tracking-wider text-[#1A120B] uppercase">
                  {clinicSettings?.clinic_name || "Glow Derm"}
                </h5>
                <p className="text-sm text-[#5C4D3E] font-bold mt-0.5">
                  {clinicSettings?.tagline || "Expert Laser and Skin Clinic"}
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] text-[11px] font-black border border-[#BAE6FD]">
                  Status: Awaiting Physical Arrival
                </div>
              </div>

              <div className="border-t border-dashed border-[#D8C5AD] mt-3 pt-3 space-y-2.5 text-xs">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Patient Name:</span>
                  <span className="font-black text-[#1A120B] text-base sm:text-lg font-serif">{createdCallReservation.patient_name}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Phone Number:</span>
                  <span className="font-black font-mono text-sm sm:text-base text-[#1A120B]">{createdCallReservation.phone}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Reserved Slot:</span>
                  <span className="text-sm sm:text-base text-[#1A120B] font-mono font-black">{formatClinicTime(createdCallReservation.time)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#1A120B] font-black">Reserved Date:</span>
                  <span className="text-sm sm:text-base text-[#1A120B] font-mono font-black">{createdCallReservation.date}</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-dashed border-[#D8C5AD] text-center text-[11px] sm:text-xs text-[#5C4D3E] font-bold italic">
                When patient physically arrives, click <strong className="text-[#1A120B]">&quot;Arrived (Give Token)&quot;</strong> in the register.
              </div>
            </div>

            <div className="pt-1.5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCreatedCallReservation(null);
                  setIsCallModalOpen(false);
                }}
                className="px-7 py-2.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] text-xs font-bold transition shadow-md"
              >
                Done & Return
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#D8C5AD] text-left max-w-md mx-auto shadow-xl relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCallModalOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg text-[#8C7A6B] hover:text-[#1A120B] hover:bg-[#EAE1D3] transition"
            >
              <span className="text-sm font-bold leading-none">✕</span>
            </button>

            {/* Header: Aesthetic Clinic Branding (Matching Walk-in Card Header) */}
            <div className="text-center border-b border-dashed border-[#D8C5AD] pb-3">
              <h5 className="font-serif font-black text-base sm:text-lg tracking-wider text-[#1A120B] uppercase">
                {clinicSettings?.clinic_name || "Glow Derm"}
              </h5>
              <p className="text-xs sm:text-sm text-[#5C4D3E] font-bold mt-0.5">
                {clinicSettings?.tagline || "Expert Laser and Skin Clinic"}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-0.5 rounded-full bg-[#FAF3EA] border border-[#D8C5AD] text-[#6B4E31] text-[11px] font-black uppercase tracking-wider">
                <PhoneCall className="w-3 h-3 text-[#A8835A]" />
                <span>Book Phone Appointment</span>
              </div>
            </div>

            {/* Form Body: Matching Walk-in Card Style */}
            <form onSubmit={handleBookCallAppointment}>
              <div className="py-2.5 space-y-3.5 max-w-[350px] mx-auto w-full">
                {/* Patient Name Input */}
                <div>
                  <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter patient name"
                    value={callName}
                    onChange={(e) => setCallName(e.target.value)}
                    className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold transition shadow-2xs"
                  />
                </div>

                {/* Phone Number Input */}
                <div>
                  <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    value={callPhone}
                    onChange={(e) => setCallPhone(e.target.value)}
                    className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] placeholder-[#8C7A6B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-semibold font-mono transition shadow-2xs"
                  />
                </div>

                {/* Procedure / Treatment Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 ml-3 mr-1">
                    <label className="block text-sm sm:text-base font-bold text-[#8C6843] dark:text-[#E5C158]">
                      Procedure / Treatment
                    </label>
                    {selectedCallService && (
                      <span className="font-mono font-black text-xs text-[#15803D] bg-[#E6F4EA] px-2.5 py-0.5 rounded-lg border border-[#BBF7D0]">
                        Rs {Number(selectedCallService.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={callServiceId}
                      onChange={(e) => setCallServiceId(e.target.value)}
                      className="w-full h-11 pl-4 pr-10 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2234] border-2 border-[#BCA58C] dark:border-[#2D3E58] text-[#1A120B] dark:text-[#FAF7F2] focus:outline-none focus:border-[#8C6843] dark:focus:border-[#E5C158] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-xs sm:text-sm font-bold transition shadow-2xs appearance-none cursor-pointer"
                    >
                      <option value="">Select Procedure (Optional)</option>
                      {canonicalServices.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} — Rs {Number(svc.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#8C6843] dark:text-[#E5C158] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Reserved Date & Time */}
                <div className="pt-2.5 border-t border-dashed border-[#D8C5AD] space-y-3">
                  {/* Appointment Date */}
                  <div>
                    <label className="block text-base sm:text-lg font-black text-[#1A120B] mb-1.5 ml-3">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                      className="w-full h-10 px-4 py-2 rounded-xl bg-[#FAF7F2] border-2 border-[#BCA58C] text-[#1A120B] focus:outline-none focus:border-[#8C6843] focus:bg-[#FFFFFF] focus:ring-2 focus:ring-[#8C6843]/20 text-sm sm:text-base font-bold font-mono transition shadow-2xs"
                    />
                  </div>

                  {/* Appointment Time (Aesthetic 1 to 12 Picker) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-3 mr-1">
                      <label className="block text-base sm:text-lg font-black text-[#1A120B]">
                        Appointment Time
                      </label>
                      <span className="font-mono font-black text-xs sm:text-sm text-[#1A120B] bg-[#F4EFE6] px-2.5 py-0.5 rounded-lg border border-[#D8C5AD] shadow-2xs">
                        {formatClinicTime(callTime)}
                      </span>
                    </div>

                    {/* Header Clock Style Container (Facebook / Creator Studio Style) */}
                    <div className="w-full h-13 px-3.5 py-2 bg-[#F4EFE6] rounded-2xl border-2 border-[#BCA58C] flex items-center justify-between shadow-xs">
                      {/* Left: Clock Icon & Label (Exact Header Style) */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4.5 h-4.5 text-[#A8835A] shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#8C7A6B]">
                          Time
                        </span>
                      </div>

                      {/* Center: Digital Interactive Time Inputs (Type & Keyboard only, perfectly centered) */}
                      <div className="flex items-center gap-1.5 font-mono">
                        {/* Hour Box (Type 01-12, perfectly centered) */}
                        <div className="relative">
                          <input
                            ref={hourInputRef}
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={callHour}
                            onFocus={(e) => e.target.select()}
                            onChange={handleHourInput}
                            onKeyDown={handleHourKeyDown}
                            onBlur={handleHourBlur}
                            placeholder="06"
                            className="w-12 h-10 text-center p-0 font-mono font-black text-xl text-[#1A120B] bg-[#FFFFFF] rounded-xl border-2 border-[#D8C5AD] focus:outline-none focus:border-[#8C6843] focus:ring-2 focus:ring-[#8C6843]/20 shadow-2xs transition select-all"
                            title="Type hour (1-12)"
                          />
                        </div>

                        {/* Flashing/Bold Colon Separator */}
                        <span className="font-mono font-black text-2xl text-[#8C6843] select-none leading-none px-0.5">
                          :
                        </span>

                        {/* Minute Box (Type 00-59, perfectly centered) */}
                        <div className="relative">
                          <input
                            ref={minInputRef}
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={callMinute}
                            onFocus={(e) => e.target.select()}
                            onChange={handleMinuteInput}
                            onKeyDown={handleMinuteKeyDown}
                            onBlur={handleMinuteBlur}
                            placeholder="00"
                            className="w-12 h-10 text-center p-0 font-mono font-black text-xl text-[#1A120B] bg-[#FFFFFF] rounded-xl border-2 border-[#D8C5AD] focus:outline-none focus:border-[#8C6843] focus:ring-2 focus:ring-[#8C6843]/20 shadow-2xs transition select-all"
                            title="Type minute (00-59)"
                          />
                        </div>
                      </div>

                      {/* Right: AM / PM Segmented Control */}
                      <div className="flex rounded-xl bg-[#EAE1D3] p-0.5 border border-[#D8C5AD] shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handlePeriodChange("AM")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            callPeriod === "AM"
                              ? "bg-[#1E1915] text-[#FAF7F2] shadow-xs"
                              : "text-[#6B5E51] hover:text-[#1A120B]"
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePeriodChange("PM")}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            callPeriod === "PM"
                              ? "bg-[#1E1915] text-[#FAF7F2] shadow-xs"
                              : "text-[#6B5E51] hover:text-[#1A120B]"
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer: Cancel & Reserve Appointment */}
              <div className="mt-4 pt-3.5 border-t border-dashed border-[#D8C5AD] flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE1D3] text-[#4A3522] text-xs sm:text-sm font-bold transition border border-[#D8C5AD]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCall}
                  className="px-6 py-2.5 rounded-xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2.5 disabled:opacity-50 border border-[#2B1E14]"
                >
                  <Calendar className="w-4 h-4 text-[#D8C5AD]" />
                  <span>{isSubmittingCall ? "Reserving..." : "Reserve Appointment"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Operator View Consultation Notes Modal */}
      <ConsultationModal
        appointment={selectedAppointmentForNotes}
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setSelectedAppointmentForNotes(null);
        }}
        readOnly={true}
      />
    </div>
  );
}


