"use client";

import React from "react";
import { type Appointment } from "@/types/database";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Sparkles } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface ReportsPageClientProps {
  initialAppointments: Appointment[];
}

export function ReportsPageClient({ initialAppointments }: ReportsPageClientProps) {
  const totalPatients = initialAppointments.length;
  const completedAppointments = initialAppointments.filter((a) => a.status === "completed");
  const cancelledAppointments = initialAppointments.filter(
    (a) => a.status === "cancelled" || a.status === "no_show"
  );

  // Calculate estimated revenue
  const totalRevenue = completedAppointments.reduce((acc, curr) => {
    return acc + (Number(curr.service?.price) || 0);
  }, 0);

  // Group service counts
  const servicePopularity: Record<string, number> = {};
  initialAppointments.forEach((a) => {
    const name = a.service?.name || "General Skin Consult";
    servicePopularity[name] = (servicePopularity[name] || 0) + 1;
  });

  const sortedServices = Object.entries(servicePopularity).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            Clinic Reports, KPIs & Revenue Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational clinical statistics, patient turnaround, and procedure demand breakdowns.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Volume" value={totalPatients} icon={Users} variant="default" />
        <StatCard title="Completed Consults" value={completedAppointments.length} icon={TrendingUp} variant="emerald" />
        <StatCard title="Est. Revenue ($)" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} variant="indigo" />
        <StatCard title="Cancellations" value={cancelledAppointments.length} icon={Calendar} variant="rose" />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Popularity Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            Top Clinical Procedures & Demand
          </h3>

          <div className="space-y-3">
            {sortedServices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No procedure data logged yet.</p>
            ) : (
              sortedServices.map(([svcName, count]) => {
                const pct = totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0;
                return (
                  <div key={svcName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{svcName}</span>
                      <span className="text-teal-400 font-mono">
                        {count} visits ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Operational Efficiency Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Operational Efficiency Breakdown
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Completion Rate:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {totalPatients > 0 ? Math.round((completedAppointments.length / totalPatients) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cancellation / No-Show Rate:</span>
              <span className="font-bold text-rose-400 font-mono">
                {totalPatients > 0 ? Math.round((cancelledAppointments.length / totalPatients) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Average Revenue Per Completed Patient:</span>
              <span className="font-bold text-teal-400 font-mono">
                ${completedAppointments.length > 0 ? (totalRevenue / completedAppointments.length).toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
