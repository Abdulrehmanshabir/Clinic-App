import { getTodayDateString } from "@/lib/utils";
import { getTodayAppointments, getActiveServices, getCurrentProfile } from "@/lib/queries";
import { ProceduresPageClient } from "@/components/procedures/procedures-page-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Clinical Procedures & Treatments | Lumière Skin Clinic",
};

import { getTodayDateString, getYesterdayDateString } from "@/lib/utils";
import { getTodayAppointments, getActiveServices, getCurrentProfile, getAppointmentsByDate } from "@/lib/queries";

export default async function ProceduresPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Fetch both today and yesterday appointments and merge them
  const [todayAppointments, yesterdayAppointments, services] = await Promise.all([
    getTodayAppointments(today),
    getAppointmentsByDate(yesterday),
    getActiveServices(),
  ]);

  const allAppointments = [...yesterdayAppointments, ...todayAppointments];

  return (
    <ProceduresPageClient
      initialAppointments={allAppointments}
      initialServices={services}
      clinicDate={today}
    />
  );
}

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const today = getTodayDateString();
  const [appointments, services] = await Promise.all([
    getTodayAppointments(today),
    getActiveServices(),
  ]);

  return (
    <ProceduresPageClient
      initialAppointments={appointments}
      initialServices={services}
      clinicDate={today}
    />
  );
}
