"use client";

import React, { useState, useMemo } from "react";
import { type ActiveSession, type Appointment, type QueueSummary, type Profile, type DoctorBreakInfo, type Service } from "@/types/database";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConsultationModal } from "@/components/doctor/consultation-modal";
import { DoctorBreakModal } from "@/components/doctor/doctor-break-modal";
import { DoctorBreakBanner } from "@/components/doctor/doctor-break-banner";
import { ProceduresSection } from "@/components/procedures/procedures-section";
import {
  startConsultation,
  completeConsultationDirect,
  updateAppointmentStatus,
  markPatientNext,
  deleteNoShowAppointment,
  setDoctorBreak,
  endDoctorBreak,
} from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { useRouter } from "next/navigation";
import {
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Stethoscope,
  Play,
  FileEdit,
  Sparkles,
  Eye,
  UserCheck,
  CheckCheck,
  UserX,
  XCircle,
  Phone,
  Coffee,
  Loader2,
  Globe,
  Trash2,
  Star,
} from "lucide-react";
import { formatClinicTime, isOnlineAppointment, isProcedureAppointment, sortAppointmentsForDashboard } from "@/lib/utils";
import { getAppointmentShift, SHIFT_LABELS } from "@/lib/session";

interface DoctorDashboardClientProps {
  initialAppointments: Appointment[];
  summary: QueueSummary;
  clinicDate: string;
  doctorProfile: Profile | null;
  initialActiveSession?: ActiveSession | null;
  initialDoctorBreak?: DoctorBreakInfo | null;
  services?: Service[];
}

export function DoctorDashboardClient({
  initialAppointments,
  clinicDate,
  initialActiveSession,
  initialDoctorBreak,
  services = [],
}: DoctorDashboardClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isNotesReadOnly, setIsNotesReadOnly] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Doctor Break states
  const [doctorBreak, setDoctorBreakState] = useState<DoctorBreakInfo | null>(initialDoctorBreak || null);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);

  // Sync state with server props
  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  React.useEffect(() => {
    setDoctorBreakState(initialDoctorBreak || null);
  }, [initialDoctorBreak]);

  // Only show patients belonging to the active clinic session
  const scopedAppointments = useMemo(() => {
    if (!initialActiveSession) return appointments;
    return appointments.filter(
      (appointment) => getAppointmentShift(appointment) === initialActiveSession.shift
    );
  }, [appointments, initialActiveSession]);

  // Supabase Realtime synchronization + cross-device call bell
  const { sendCallBell, sendBreakBell } = useRealtimeAppointments({
    clinicDate,
    onUpdate: () => {
      router.refresh();
    },
  });

  // Memoized live summary calculations for maximum performance & zero lag
  const summary: QueueSummary = useMemo(() => {
    let waiting = 0;
    let called = 0;
    let in_consultation = 0;
    let completed = 0;
    let cancelled = 0;
    let no_show = 0;
    let total = 0;

    for (let i = 0; i < scopedAppointments.length; i++) {
      const a = scopedAppointments[i];
      if (!isProcedureAppointment(a) && a.token != null) total++;
      if (a.status === "waiting" && a.token != null) waiting++;
      else if (a.status === "called" && a.token != null) called++;
      else if (a.status === "in_consultation") in_consultation++;
      else if (a.status === "completed") completed++;
      else if (a.status === "cancelled") cancelled++;
      else if (a.status === "no_show") no_show++;
    }

    return {
      total,
      waiting,
      called,
      in_consultation,
      completed,
      cancelled,
      no_show,
    };
  }, [scopedAppointments]);

  const callBookingsCount = useMemo(() => {
    return scopedAppointments.filter(
      (a) => a.appointment_type === "scheduled" && a.token == null && a.status !== "completed" && a.status !== "no_show"
    ).length;
  }, [scopedAppointments]);

  // Procedure counts
  const procedureCount = useMemo(() => {
    return scopedAppointments.filter((a) => isProcedureAppointment(a)).length;
  }, [scopedAppointments]);

  const completeProcedureCount = useMemo(() => {
    return scopedAppointments.filter(
      (a) => isProcedureAppointment(a) && a.status === "completed"
    ).length;
  }, [scopedAppointments]);

  // Online patient counts — only appointments explicitly marked as online by the operator
  const onlinePatientCount = useMemo(() => {
    return scopedAppointments.filter((a) => isOnlineAppointment(a)).length;
  }, [scopedAppointments]);

  const onlinePatientCompleteCount = useMemo(() => {
    return scopedAppointments.filter(
      (a) => isOnlineAppointment(a) && a.status === "completed"
    ).length;
  }, [scopedAppointments]);

  const simpleCompletedCount = useMemo(() => {
    return scopedAppointments.filter(
      (a) => a.status === "completed" && !isOnlineAppointment(a) && !isProcedureAppointment(a)
    ).length;
  }, [scopedAppointments]);

  const handleStartConsultation = async (appointment: Appointment) => {
    setLoadingAction(appointment.id);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointment.id
          ? { ...a, status: "in_consultation" }
          : a.status === "in_consultation"
          ? { ...a, status: "completed" }
          : a
      )
    );

    try {
      const res = await startConsultation(appointment.id);
      if (res.success) {
        success("Patient In Room", `Now consulting: ${appointment.patient?.full_name} (${appointment.token?.token_number || "Token"})`);
        router.refresh();
      } else {
        error("Action Failed", res.error || "Could not start consultation");
        router.refresh();
      }
    } catch {
      error("Error", "An unexpected error occurred");
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDirectComplete = async (appointmentId: string, patientName?: string) => {
    setLoadingAction(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "completed" } : a))
    );

    try {
      const res = await completeConsultationDirect(appointmentId);
      if (res.success) {
        success("Consultation Completed", `${patientName || "Patient"} marked as completed`);
        router.refresh();
      } else {
        error("Action Failed", res.error || "Could not complete consultation");
        router.refresh();
      }
    } catch {
      error("Error", "An unexpected error occurred");
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCallPatient = async (appointmentId: string) => {
    const calledAppointment = appointments.find((a) => a.id === appointmentId);
    setLoadingAction(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "called" } : a))
    );

    try {
      const res = await markPatientNext(appointmentId);
      if (res.success) {
        sendCallBell({
          token: calledAppointment?.token?.token_number,
          patient: calledAppointment?.patient?.full_name,
        });
        success("Patient Called Next", "This patient will be seen before the normal queue");
        router.refresh();
      } else {
        error("Action Failed", res.error);
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkAbsent = async (appointmentId: string, patientName?: string) => {
    setLoadingAction(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "no_show" } : a))
    );

    try {
      const res = await updateAppointmentStatus(appointmentId, "no_show");
      if (res.success) {
        success("Patient Marked Absent", `${patientName || "Patient"} marked as Absent / Skipped`);
        router.refresh();
      } else {
        error("Action Failed", res.error);
        router.refresh();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteAbsent = async (appointmentId: string, patientName?: string) => {
    if (
      !window.confirm(
        `Permanently delete ${patientName || "this absent patient"}? This will remove the patient from today's Total and cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(appointmentId);

    try {
      const res = await deleteNoShowAppointment(appointmentId);
      if (res.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
        success("Absent Patient Deleted", `${patientName || "Patient"} has been removed from today's Total.`);
        router.refresh();
      } else {
        error("Delete Failed", res.error || "Could not delete absent patient");
      }
    } catch {
      error("Error", "An unexpected error occurred while deleting the patient");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelConsultation = async (appointmentId: string, patientName?: string) => {
    setCancellingId(appointmentId);
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "waiting" } : a))
    );

    try {
      const res = await updateAppointmentStatus(appointmentId, "waiting");
      if (res.success) {
        success("Consultation Cancelled", `${patientName || "Patient"} returned to the waiting queue`);
        router.refresh();
      } else {
        error("Action Failed", res.error);
        router.refresh();
      }
    } catch {
      error("Error", "An unexpected error occurred");
      router.refresh();
    } finally {
      setCancellingId(null);
    }
  };

  // Find currently active patient in consultation
  const activeConsultation = scopedAppointments.find((a) => a.status === "in_consultation");

  // Called patient always comes first, then the normal waiting queue
  const waitingQueue = useMemo(() => {
    return scopedAppointments
      .filter((a) => (a.status === "waiting" || a.status === "called") && a.token != null)
      .sort((a, b) => {
        const calledDiff =
          (a.status === "called" ? 0 : 1) - (b.status === "called" ? 0 : 1);
        if (calledDiff !== 0) return calledDiff;
        const posA = a.token?.queue_position || 999;
        const posB = b.token?.queue_position || 999;
        return posA - posB;
      });
  }, [scopedAppointments]);

  // Next patient in line
  const nextPatientInLine = waitingQueue[0] || null;

  const handleCompleteAndCallNextFromModal = async (
    currentData: { appointment_id?: string; doctor_notes?: string; treatment_notes?: string | null; follow_up_date?: string | null },
    nextApp: Appointment
  ) => {
    if (!selectedAppointment) return;
    const { completeConsultation } = await import("@/lib/actions");
    const completeRes = await completeConsultation({
      ...currentData,
      appointment_id: selectedAppointment.id,
    });

    if (!completeRes.success) {
      error("Error", completeRes.error || "Could not complete current consultation");
      return;
    }

    const startRes = await startConsultation(nextApp.id);
    if (startRes.success) {
      success("Next Patient Called", `Now consulting: ${nextApp.patient?.full_name} (${nextApp.token?.token_number})`);
      setSelectedAppointment(nextApp);
      setIsConsultationOpen(false);
      router.refresh();
    } else {
      error("Error", startRes.error || "Completed previous, but failed to start next patient");
      setIsConsultationOpen(false);
      router.refresh();
    }
  };

  // Filter queue list based on selected view
  const filteredAppointments = useMemo(() => {
    const filtered = scopedAppointments.filter((a) => {
      if (activeFilter === "all") return !isProcedureAppointment(a);
      if (activeFilter === "active") {
        return (a.status === "in_consultation" || a.status === "waiting" || a.status === "called") && a.token != null;
      }
      if (activeFilter === "call_bookings") {
        return a.appointment_type === "scheduled" && a.token == null && a.status !== "no_show" && a.status !== "completed";
      }
      if (activeFilter === "procedure") {
        return isProcedureAppointment(a);
      }
      if (activeFilter === "complete_procedure") {
        return isProcedureAppointment(a) && a.status === "completed";
      }
      if (activeFilter === "online") {
        return isOnlineAppointment(a);
      }
      if (activeFilter === "online_complete") {
        return isOnlineAppointment(a) && a.status === "completed";
      }
      if (activeFilter === "completed") {
        return a.status === "completed" && !isOnlineAppointment(a) && !isProcedureAppointment(a);
      }
      if (activeFilter === "no_show") return a.status === "no_show";
      return true;
    });
    return sortAppointmentsForDashboard(filtered);
  }, [scopedAppointments, activeFilter]);

  // Break Management Handlers
  const handleStartBreak = async (breakType: string, customReason?: string) => {
    setIsBreakLoading(true);
    try {
      const res = await setDoctorBreak(clinicDate, breakType, customReason);
      if (res.success && res.data) {
        const breakInfo = res.data as DoctorBreakInfo;
        setDoctorBreakState(breakInfo);
        sendBreakBell({
          breakType: breakInfo.break_type || breakType,
          doctorName: breakInfo.doctor_name,
        });
        setIsBreakModalOpen(false);
        success("Break Activated ?", `You are now on ${breakType}. Reception is alerted.`);
        router.refresh();
      } else {
        error("Action Failed", res.error || "Could not set break");
      }
    } catch {
      error("Error", "Unexpected error setting break");
    } finally {
      setIsBreakLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setIsBreakLoading(true);
    try {
      const res = await endDoctorBreak(clinicDate);
      if (res.success) {
        setDoctorBreakState(null);
        success("Welcome Back! 🟢", "Clinic consultations resumed. Reception is alerted.");
        router.refresh();
      } else {
        error("Action Failed", res.error || "Could not end break");
      }
    } catch {
      error("Error", "Unexpected error ending break");
    } finally {
      setIsBreakLoading(false);
    }
  };

  const isProcedureView = activeFilter === "procedure" || activeFilter === "complete_procedure";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Header - Clean Luxury Banner */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120B] dark:text-[#FFFFFF] tracking-tight">
            Doctor Clinical Console
          </h2>
          <p className="text-sm sm:text-base text-[#8C6843] dark:text-[#E5C158] font-bold mt-1">
            Manage patient queue, write prescriptions, and take clinic breaks.
          </p>
        </div>

        {/* Doctor Break Action Button (Only shown when not on break) */}
        {!doctorBreak?.on_break && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBreakModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#8C6843] hover:bg-[#785838] text-white dark:bg-[#1A2438] dark:hover:bg-[#223048] dark:text-[#D4AF37] font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 border-2 border-[#745534] dark:border-[#D4AF37] dark:hover:border-[#E5C158] cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <Coffee className="w-4.5 h-4.5 text-white dark:text-[#D4AF37]" />
              <span>Take Break</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Break Banner (Displayed when Doctor is on break) */}
      {doctorBreak?.on_break && (
        <DoctorBreakBanner
          breakInfo={doctorBreak}
          onEndBreak={handleEndBreak}
          isLoading={isBreakLoading}
          isDoctorView={true}
        />
      )}

      {/* KPI Stats Grid - 8 Full Color Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Row 1: Core Queue Metrics */}
        <StatCard
          title={
            initialActiveSession
              ? `${SHIFT_LABELS[initialActiveSession.shift]} Patients`
              : "Today Total Patients"
          }
          value={summary.total}
          icon={Users}
          variant="yellow"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <StatCard
          title="Active Waiting"
          value={summary.waiting}
          icon={Clock}
          variant="rose"
          active={activeFilter === "active"}
          onClick={() => setActiveFilter("active")}
        />
        <StatCard
          title="Call Bookings"
          value={callBookingsCount}
          icon={PhoneCall}
          variant="sky"
          active={activeFilter === "call_bookings"}
          onClick={() => setActiveFilter("call_bookings")}
        />
        <StatCard
          title="Completed"
          value={simpleCompletedCount}
          icon={CheckCircle2}
          variant="emerald"
          active={activeFilter === "completed"}
          onClick={() => setActiveFilter("completed")}
        />

        {/* Row 2: Procedures & Online Metrics (User Request) */}
        <StatCard
          title="Procedure"
          value={procedureCount}
          icon={Sparkles}
          variant="peach"
          active={activeFilter === "procedure"}
          onClick={() => setActiveFilter("procedure")}
        />
        <StatCard
          title="Complete Procedure"
          value={completeProcedureCount}
          icon={CheckCheck}
          variant="gray"
          active={activeFilter === "complete_procedure"}
          onClick={() => setActiveFilter("complete_procedure")}
        />
        <StatCard
          title="Online Patient"
          value={onlinePatientCount}
          icon={Globe}
          variant="teal"
          active={activeFilter === "online"}
          onClick={() => setActiveFilter("online")}
        />
        <StatCard
          title="Online Patient Complete"
          value={onlinePatientCompleteCount}
          icon={UserCheck}
          variant="orange"
          active={activeFilter === "online_complete"}
          onClick={() => setActiveFilter("online_complete")}
        />
      </div>

      {/* Patient Spotlight Cards (Currently In Room & Next In Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Currently In Consultation */}
        {activeConsultation ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FCFAF6] to-[#F3E9DA] dark:from-[#131B2A] dark:via-[#151E30] dark:to-[#1A2438] border border-[#E3D6C4] dark:border-[#2D3E58] aesthetic-card-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8C6843] via-[#D4AF37] to-[#E5C158]" />
            <div className="pointer-events-none absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#D4AF37]/10 blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-16 w-40 h-40 rounded-full bg-[#8C6843]/5 blur-2xl" />

            <div className="relative space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A120B] text-[#FCFAF6] text-xs font-bold uppercase tracking-wider shadow-md shadow-[#10B981]/20 ring-1 ring-white/15">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                  Currently In Room
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-[#1A120B] tracking-tight bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur px-4 py-1.5 rounded-2xl border-2 border-[#D8C5AD] dark:border-[#2D3E58] shadow-sm">
                  {activeConsultation.token?.token_number}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#1A120B] dark:text-[#FFFFFF] leading-tight tracking-tight">
                  {activeConsultation.patient?.full_name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur border border-[#E9DFD1] dark:border-[#2D3E58] font-black text-[#2B1E14] dark:text-[#F8FAFC] flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#A8835A] dark:text-[#E5C158]" />
                  {activeConsultation.service?.name || "Skin Consultation"}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur border border-[#E9DFD1] dark:border-[#2D3E58] font-black text-[#2B1E14] dark:text-[#F8FAFC] flex items-center gap-1.5 font-mono shadow-2xs">
                  <Clock className="w-4 h-4 text-[#A8835A] dark:text-[#E5C158]" />
                  {formatClinicTime(activeConsultation.appointment_time)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8DFD1] dark:border-[#243248] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsNotesReadOnly(false);
                  setSelectedAppointment(activeConsultation);
                  setIsConsultationOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#1A120B] border border-[#D8C5AD] text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                title="Notes"
              >
                <FileEdit className="w-4 h-4 text-[#A8835A]" />
                <span>Notes</span>
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleCancelConsultation(activeConsultation.id, activeConsultation.patient?.full_name)}
                  disabled={cancellingId === activeConsultation.id || loadingAction === activeConsultation.id}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1A2230] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1A24] text-[#DC2626] dark:text-[#EF4444] border-2 border-[#DC2626] dark:border-[#EF4444] text-xs font-black shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Cancel consultation and return patient to waiting"
                >
                  {cancellingId === activeConsultation.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectComplete(activeConsultation.id, activeConsultation.patient?.full_name)}
                  disabled={loadingAction === activeConsultation.id || cancellingId === activeConsultation.id}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 border border-[#2B1E14] cursor-pointer disabled:opacity-50"
                >
                  {loadingAction === activeConsultation.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                      <span>Complete Consultation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col items-center justify-center text-center space-y-2.5 min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] border border-[#E9DFD1] flex items-center justify-center text-[#8C6843] shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <p className="text-base sm:text-lg font-serif font-bold text-[#1A120B]">Doctor Room is Available</p>
          </div>
        )}

        {/* Card 2: Next Patient In Line */}
        {nextPatientInLine ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FCFAF6] to-[#F6ECDD] dark:from-[#131B2A] dark:via-[#151E30] dark:to-[#1A2438] border border-[#E3D6C4] dark:border-[#2D3E58] aesthetic-card-shadow flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1A120B] via-[#8C6843] to-[#E5C158]" />
            <div className="pointer-events-none absolute -left-16 -top-16 w-44 h-44 rounded-full bg-[#8C6843]/10 blur-2xl" />
            <div className="pointer-events-none absolute -right-12 -bottom-16 w-40 h-40 rounded-full bg-[#D4AF37]/10 blur-2xl" />

            <div className="relative space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A120B] text-[#FCFAF6] text-xs font-black uppercase tracking-wider shadow-md shadow-[#8C6843]/20 ring-1 ring-white/15">
                    <Clock className="w-3.5 h-3.5 text-[#E6D5C3]" />
                    {nextPatientInLine.status === "called"
                      ? "Next In Line (Priority)"
                      : "Next In Line (Waiting)"}
                  </span>
                </div>
                <span className="font-mono font-black text-2xl sm:text-3xl text-[#1A120B] tracking-tight bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur px-4 py-1.5 rounded-2xl border-2 border-[#D8C5AD] dark:border-[#2D3E58] shadow-sm">
                  {nextPatientInLine.token?.token_number}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#1A120B] dark:text-[#FFFFFF] leading-tight tracking-tight">
                  {nextPatientInLine.patient?.full_name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur border border-[#E9DFD1] dark:border-[#2D3E58] font-black text-[#2B1E14] dark:text-[#F8FAFC] flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#A8835A] dark:text-[#E5C158]" />
                  {nextPatientInLine.service?.name || "Skin Consultation"}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-[#1A2234]/80 backdrop-blur border border-[#E9DFD1] dark:border-[#2D3E58] font-black text-[#2B1E14] dark:text-[#F8FAFC] flex items-center gap-1.5 font-mono shadow-2xs">
                  <Clock className="w-4 h-4 text-[#A8835A] dark:text-[#E5C158]" />
                  Arrival: {formatClinicTime(nextPatientInLine.appointment_time)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8DFD1] flex flex-wrap items-center justify-between gap-2.5">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  onClick={() => handleCallPatient(nextPatientInLine.id)}
                  disabled={loadingAction === nextPatientInLine.id}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#1A120B] border border-[#D8C5AD] text-xs font-bold transition shadow-xs text-center"
                >
                  Call Out Token
                </button>
                <button
                  onClick={() => handleMarkAbsent(nextPatientInLine.id, nextPatientInLine.patient?.full_name)}
                  disabled={loadingAction === nextPatientInLine.id}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-transparent hover:bg-[#F4EFE6] dark:hover:bg-[#1A2234] text-[#DC2626] dark:text-[#EF4444] border-2 border-[#DC2626] dark:border-[#EF4444] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="Patient not present"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Skip / Absent
                </button>
              </div>

              <button
                onClick={() => handleStartConsultation(nextPatientInLine)}
                disabled={loadingAction === nextPatientInLine.id}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#1E1915] hover:bg-[#382C22] text-[#FAF7F2] font-bold text-xs shadow-md shadow-[#1E1915]/15 transition flex items-center justify-center gap-2 border border-[#2B1E14]"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#D8C5AD]" />
                Start Consultation
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#FCFAF6] border border-[#E8DFD1] aesthetic-card-shadow flex flex-col items-center justify-center text-center space-y-2.5 min-h-[200px]">
            <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] border border-[#E9DFD1] flex items-center justify-center text-[#8C6843] shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-base sm:text-lg font-serif font-bold text-[#1A120B]">Waiting Queue is Empty</p>
          </div>
        )}
      </div>

      {/* Main Live Queue Table (Exact Column Headers & Styling Matching Operator Desk) */}
      <div className="rounded-3xl border border-[#E8DFD1] bg-[#FCFAF6] overflow-hidden aesthetic-card-shadow">
        <div className="px-5 sm:px-7 py-5 border-b border-[#E8DFD1] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A120B] dark:text-[#FAF7F2]">
              {activeFilter === "procedure"
                ? "Procedure Patients"
                : activeFilter === "complete_procedure"
                ? "Completed Procedures"
                : activeFilter === "online"
                ? "Online Patients"
                : activeFilter === "online_complete"
                ? "Completed Online Patients"
                : activeFilter === "active"
                ? "Active Queue Patients"
                : activeFilter === "call_bookings"
                ? "Call Bookings"
                : activeFilter === "completed"
                ? "Completed Consultations"
                : activeFilter === "no_show"
                ? "Absent / Not Present"
                : "All Today's Patients"}
            </h3>
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#FAF7F2] bg-[#FAF7F2] dark:bg-[#1A2230] px-3.5 py-1.5 rounded-xl border-2 border-[#8C6843] dark:border-[#34D399] shadow-2xs whitespace-nowrap inline-flex items-center justify-center">
              {filteredAppointments.length} Records
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 bg-[#F4EFE6] rounded-2xl border border-[#E9DFD1] overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Patients" },
              { id: "active", label: "Active Queue" },
              { id: "procedure", label: `Procedure (${procedureCount})` },
              { id: "online", label: `Online (${onlinePatientCount})` },
              { id: "completed", label: "Completed" },
              { id: "no_show", label: "Not Present" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-150 ${
                  activeFilter === f.id
                    ? "bg-[#1E1915] text-[#FAF7F2] shadow-sm shadow-[#1E1915]/10"
                    : "text-[#1A120B] hover:text-[#1E1915] hover:bg-[#EFE6D8]/80"
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
                {isProcedureView ? (
                  <>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Procedure & Price</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Patient Name</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Phone Number</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Queue Action</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Patient Name</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Phone Number</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Reserved Time</th>
                    <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Queue Action</th>
                  </>
                )}
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Status</th>
                <th className="px-6 py-5 text-center font-black text-base sm:text-lg text-[#1A120B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE6D8]">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-[#8C6843] dark:text-[#E5C158]">
                    <div className="max-w-sm mx-auto space-y-1.5 py-2">
                      <p className="font-bold text-lg text-[#1A120B] dark:text-[#FFFFFF]">No patients found</p>
                      <p className="text-base text-[#8C6843] dark:text-[#E5C158] font-bold">No records matching the selected queue filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-[#F7F3EB]/50 transition-colors duration-150 ${
                      app.status === "in_consultation"
                        ? "bg-[#FAF5FF]"
                        : app.status === "no_show"
                        ? "bg-[#FEF2F2]/50"
                        : isOnlineAppointment(app) && !app.token
                        ? "bg-[#ECFDF5]/40"
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
                      ) : isOnlineAppointment(app) ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-base font-bold font-mono">
                          <Globe className="w-4 h-4" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-base font-bold font-mono">
                          <PhoneCall className="w-4 h-4" />
                          Call Booking
                        </span>
                      )}
                    </td>

                    {isProcedureView ? (
                      <>
                        {/* Procedure & Price */}
                        <td className="px-6 py-4 text-center">
                          {app.service ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="text-[11px] font-bold text-[#8C6843] dark:text-[#E5C158] max-w-[150px] truncate">
                                {app.service.name}
                              </span>
                              <span className="font-mono font-bold text-xs text-[#B45309] dark:text-[#FCD34D]">
                                Rs {Number(app.service.price).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#A89887] font-medium">—</span>
                          )}
                        </td>

                        {/* Patient Name */}
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-[#1A120B] text-base">
                            {app.patient?.full_name}
                          </div>
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

                        {/* Queue Action for Procedure (before Status) */}
                        <td className="px-6 py-4 text-center">
                          {app.status === "waiting" && app.token ? (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(app.id)}
                              disabled={loadingAction === app.id}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-black tracking-wide border border-[#065F46] shadow-md shadow-[#047857]/25 transition disabled:opacity-50"
                              title="Call this patient before the normal queue"
                            >
                              {loadingAction === app.id ? "Calling..." : "Call Next"}
                            </button>
                          ) : app.status === "called" ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-xs font-black shadow-2xs whitespace-nowrap">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              Next
                            </span>
                          ) : app.status === "in_consultation" ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-xs font-black shadow-2xs whitespace-nowrap">
                              In Room
                            </span>
                          ) : (
                            <span className="text-xs text-[#A89887] font-medium">—</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Patient Name */}
                        <td className="px-6 py-4 text-center">
                          <div className="font-bold text-[#1A120B] text-base">
                            {app.patient?.full_name}
                          </div>
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

                        {/* Reserved / Arrival Time */}
                        <td className="px-6 py-4 text-center">
                          <span className="px-3.5 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#E9DFD1] text-base font-bold text-[#1A120B] inline-flex items-center gap-1.5 shadow-2xs">
                            <Clock className="w-4 h-4 text-[#A8835A]" />
                            {formatClinicTime(app.appointment_time)}
                          </span>
                        </td>

                        {/* Queue Action (before Status) */}
                        <td className="px-6 py-4 text-center">
                          {app.status === "waiting" && app.token ? (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(app.id)}
                              disabled={loadingAction === app.id}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white text-xs font-black tracking-wide border border-[#065F46] shadow-md shadow-[#047857]/25 transition disabled:opacity-50"
                              title="Call this patient before the normal queue"
                            >
                              {loadingAction === app.id ? "Calling..." : "Call Next"}
                            </button>
                          ) : app.status === "called" ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-xs font-black shadow-2xs whitespace-nowrap">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              Next
                            </span>
                          ) : app.status === "in_consultation" ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE] text-xs font-black shadow-2xs whitespace-nowrap">
                              In Room
                            </span>
                          ) : (
                            <span className="text-xs text-[#A89887] font-medium">—</span>
                          )}
                        </td>
                      </>
                    )}

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
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNotesReadOnly(true);
                            setSelectedAppointment(app);
                            setIsConsultationOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFE6] text-[#1A120B] border border-[#D8C5AD] text-xs font-bold transition inline-flex items-center gap-1.5 shadow-2xs"
                          title="View Notes"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#A8835A]" />
                          View Notes
                        </button>
                        {app.status === "no_show" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAbsent(app.id, app.patient?.full_name)}
                            disabled={deletingId === app.id}
                            className="absent-delete-btn w-9 h-9 rounded-xl border transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            title="Delete absent patient from Total"
                            aria-label="Delete absent patient"
                          >
                            {deletingId === app.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-[18px] h-[18px]" strokeWidth={2.25} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Procedures & Patient Demand Section */}
      <ProceduresSection
        appointments={scopedAppointments}
        services={services}
        isDoctorView={true}
        onCallPatient={handleCallPatient}
        loadingAction={loadingAction}
      />

      {/* Doctor Consultation Modal */}
      <ConsultationModal
        appointment={selectedAppointment}
        nextAppointment={nextPatientInLine}
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onSuccess={() => router.refresh()}
        onCompleteAndCallNext={handleCompleteAndCallNextFromModal}
        readOnly={isNotesReadOnly}
      />

      {/* Doctor Break Selection Modal */}
      <DoctorBreakModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        onStartBreak={handleStartBreak}
        isLoading={isBreakLoading}
      />
    </div>
  );
}
