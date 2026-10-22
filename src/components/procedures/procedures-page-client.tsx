"use client";

import React, { useState, useEffect } from "react";
import { type Appointment, type Service } from "@/types/database";
import { ProceduresSection } from "./procedures-section";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRealtimeAppointments } from "@/hooks/use-realtime-appointments";
import { useRouter } from "next/navigation";

interface ProceduresPageClientProps {
  initialAppointments: Appointment[];
  initialServices: Service[];
  clinicDate: string;
}

export function ProceduresPageClient({
  initialAppointments,
  initialServices,
  clinicDate,
}: ProceduresPageClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [services, setServices] = useState<Service[]>(initialServices);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  // Realtime live synchronization
  useRealtimeAppointments({
    clinicDate,
    onUpdate: () => {
      router.refresh();
    },
  });

  // Calculate live stats
  const totalRevenue = appointments.reduce((sum, a) => {
    if (a.service?.price) return sum + Number(a.service.price);
    return sum;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner - Luxury Aesthetic Styling */}
      <div className="p-6 rounded-3xl bg-[#FCFAF6] dark:bg-[#131924] border border-[#E8DFD1] dark:border-[#232F42] aesthetic-card-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/doctor"
              className="w-9 h-9 rounded-2xl bg-[#F4EFE6] dark:bg-[#1E293B] border border-[#E9DFD1] dark:border-[#2E3C51] text-[#8C6843] dark:text-[#D4AF37] hover:text-[#1A120B] dark:hover:text-white flex items-center justify-center transition shadow-xs"
              title="Return to Doctor Console"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1A120B] dark:text-[#F8FAFC] tracking-tight">
              Clinical Procedures & Treatments
            </h2>
          </div>
          <p className="text-xs text-[#8C7A6B] dark:text-[#94A3B8] font-bold mt-1.5 ml-12">
            Daily tracking of clinic procedures and patient visits.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Today Total Patients */}
          <div className="px-4 sm:px-5 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A2230] border-2 border-[#8C6843] dark:border-[#D4AF37] shadow-xs flex items-center gap-2.5 whitespace-nowrap">
            <Users className="w-4 h-4 text-[#8C6843] dark:text-[#E5C158]" />
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-[#E5C158]">
              Today Total Patients:
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-[#1A120B] dark:text-white">
              {appointments.length}
            </span>
          </div>

          {/* Estimated Value - White Text & Count */}
          <div className="px-4 sm:px-5 py-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#1A2230] border-2 border-[#8C6843] dark:border-[#34D399] shadow-xs flex items-center gap-2.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#8C6843] dark:bg-[#34D399] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-[#1A120B] dark:text-white">
              Estimated Value:
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-[#1A120B] dark:text-white">
              Rs {totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main 7 Procedures Section */}
      <ProceduresSection
        appointments={appointments}
        services={services}
        isDoctorView={true}
      />
    </div>
  );
}
