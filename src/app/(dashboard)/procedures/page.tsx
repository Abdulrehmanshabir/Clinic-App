import { getTodayDateString } from "@/lib/utils";
import { getTodayAppointments, getActiveServices, getCurrentProfile } from "@/lib/queries";
import { ProceduresPageClient } from "@/components/procedures/procedures-page-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Clinical Procedures & Treatments | Lumière Skin Clinic",
};

export default async function ProceduresPage() {
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
