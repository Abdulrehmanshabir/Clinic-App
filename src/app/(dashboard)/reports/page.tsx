import { createClient } from "@/lib/supabase/server";
import { ReportsPageClient } from "@/components/reports/reports-page-client";
import { getCurrentProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import { type Appointment } from "@/types/database";

export const metadata = {
  title: "Reports & KPIs | Lumière Skin Clinic",
};

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      *,
      service:services (*),
      patient:patients (*)
    `)
    .order("appointment_date", { ascending: false });

  return <ReportsPageClient initialAppointments={(appointments as Appointment[]) || []} />;
}
