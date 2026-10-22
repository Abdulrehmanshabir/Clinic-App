"use client";

import React, { useState } from "react";
import { type Appointment, type QueueSummary, type ClinicDay } from "@/types/database";
import { formatClinicDate, formatClinicTime } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { closeClinicDay, reopenClinicDay } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import {
  History,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HistoryPageClientProps {
  initialAppointments: Appointment[];
  initialSummary: QueueSummary;
  initialClinicDay: ClinicDay | null;
  selectedDate: string;
}

export function HistoryPageClient({
  initialAppointments,
  initialSummary,
  initialClinicDay,
  selectedDate,
}: HistoryPageClientProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [date, setDate] = useState(selectedDate);
  const [loading, setLoading] = useState(false);
  const [closingNotes, setClosingNotes] = useState("");
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/history?date=${newDate}`);
  };

  const handleQuickRange = (range: "today" | "yesterday") => {
    const d = new Date();
    if (range === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    const formatted = d.toISOString().split("T")[0];
    handleDateChange(formatted);
  };

  const handleCloseDay = async () => {
    setLoading(true);
    try {
      const res = await closeClinicDay(date, closingNotes);
      if (res.success) {
        success("Clinic Day Closed", `Day ${date} has been officially recorded as closed.`);
        setIsCloseModalOpen(false);
        router.refresh();
      } else {
        error("Failed", res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReopenDay = async () => {
    if (!confirm("Are you sure you want to reopen this clinic day?")) return;
    setLoading(true);
    try {
      const res = await reopenClinicDay(date);
      if (res.success) {
        success("Clinic Day Reopened");
        router.refresh();
      } else {
        error("Failed", res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-teal-400" />
            Date-Wise Historical Records & Daily Closing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query past clinic dates, examine patient consultations, and safely execute day-end reconciliation.
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickRange("today")}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300"
          >
            Today
          </button>
          <button
            onClick={() => handleQuickRange("yesterday")}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300"
          >
            Yesterday
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-1.5 text-xs text-white outline-none"
          />

          {/* Close / Reopen Day Button */}
          {initialClinicDay?.status === "closed" ? (
            <button
              onClick={handleReopenDay}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              Day Closed (Reopen)
            </button>
          ) : (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Close Clinic Day
            </button>
          )}
        </div>
      </div>

      {/* Day Status Notice */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-teal-400" />
          <div>
            <span className="text-slate-400 block">Selected Clinic Date</span>
            <span className="font-bold text-white text-sm">{formatClinicDate(date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Day Status:</span>
          {initialClinicDay?.status === "closed" ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase tracking-wider text-[10px]">
              Closed & Archived
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase tracking-wider text-[10px]">
              Open for Queue
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Consultations" value={initialSummary.total} icon={Users} variant="default" />
        <StatCard title="Completed" value={initialSummary.completed} icon={CheckCircle2} variant="emerald" />
        <StatCard title="Waiting / Left" value={initialSummary.waiting} icon={Clock} variant="amber" />
        <StatCard title="Cancelled / No Show" value={initialSummary.cancelled + initialSummary.no_show} icon={AlertTriangle} variant="rose" />
      </div>

      {/* Historical Appointments Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Records for {formatClinicDate(date)}</h3>
          <span className="text-xs text-slate-400 font-mono">
            {initialAppointments.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Token</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Doctor Notes / Treatment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {initialAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 text-sm">
                    No clinical records found for {formatClinicDate(date)}.
                  </td>
                </tr>
              ) : (
                initialAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/40 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-teal-400">
                      {app.token?.token_number || "T-000"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{app.patient?.full_name}</div>
                      <div className="text-xs text-slate-400">{app.patient?.patient_number}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      {formatClinicTime(app.appointment_time)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">
                      {app.service?.name || "Skin Consult"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 max-w-xs truncate">
                      {app.consultation?.doctor_notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Daily Closing */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Lock className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Daily Clinic Closing</h3>
            </div>
            <p className="text-xs text-slate-400">
              Closing clinic day for <span className="font-bold text-white">{formatClinicDate(date)}</span> locks queue operations while permanently preserving all medical visit logs.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Patients:</span>
                <span className="font-bold text-white">{initialSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completed Sessions:</span>
                <span className="font-bold text-emerald-400">{initialSummary.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waiting/Unattended:</span>
                <span className="font-bold text-amber-400">{initialSummary.waiting}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Closing Summary Notes (Optional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={2}
                placeholder="Staff notes, financial summary, or end-of-day observations..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseDay}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Confirm & Close Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
