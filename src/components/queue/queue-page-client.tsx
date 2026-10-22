"use client";

import React from "react";
import { type Appointment } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { useRouter } from "next/navigation";
import { ListOrdered, Clock } from "lucide-react";
import { formatClinicTime } from "@/lib/utils";

interface QueuePageClientProps {
  initialAppointments: Appointment[];
  clinicDate: string;
}

export function QueuePageClient({
  initialAppointments,
  clinicDate,
}: QueuePageClientProps) {
  const router = useRouter();

  // Supabase Realtime synchronization
  useRealtimeAppointments({
    clinicDate,
    onUpdate: () => {
      router.refresh();
    },
  });

  const waitingQueue = initialAppointments.filter(
    (a) => a.status === "waiting" || a.status === "called"
  );
  const inConsultation = initialAppointments.filter((a) => a.status === "in_consultation");
  const completedQueue = initialAppointments.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-teal-400" />
            Live Clinic Queue Display
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime waiting room token tracking for patients and clinic staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Realtime Connected
          </span>
        </div>
      </div>

      {/* Grid: In Session vs Next Waiting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active & Waiting Tokens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Currently In Doctor Room */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              Now Serving (In Consultation)
            </h3>

            {inConsultation.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm">
                No patient currently in consultation room.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inConsultation.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-indigo-950/30 border-2 border-indigo-500/50 shadow-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-3xl font-mono font-black text-indigo-300">
                        {app.token?.token_number}
                      </div>
                      <div className="text-base font-bold text-white mt-1">
                        {app.patient?.full_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {app.service?.name || "Skin Consult"}
                      </div>
                    </div>
                    <StatusBadge status="in_consultation" size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiting Queue List */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Queue ({waitingQueue.length} Waiting)
            </h3>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden divide-y divide-slate-800/60">
              {waitingQueue.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Queue is clear. No waiting patients.
                </div>
              ) : (
                waitingQueue.map((app, index) => (
                  <div
                    key={app.id}
                    className={`p-4 flex items-center justify-between hover:bg-slate-900/40 transition ${
                      app.status === "called" ? "bg-sky-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-extrabold text-teal-400 text-base">
                        {app.token?.token_number}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {app.patient?.full_name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{formatClinicTime(app.appointment_time)}</span>
                          <span>• {app.service?.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium">#{index + 1} in line</span>
                      <StatusBadge status={app.status} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Recently Completed Tokens */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Recently Completed ({completedQueue.length})
          </h3>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden divide-y divide-slate-800/60">
            {completedQueue.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No completed sessions yet today.
              </div>
            ) : (
              completedQueue.slice(0, 10).map((app) => (
                <div key={app.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-300 text-sm">
                      {app.token?.token_number}
                    </div>
                    <div className="text-xs font-semibold text-slate-400">
                      {app.patient?.full_name}
                    </div>
                  </div>
                  <StatusBadge status="completed" size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
