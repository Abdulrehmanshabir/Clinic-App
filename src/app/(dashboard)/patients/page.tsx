import { createClient } from "@/lib/supabase/server";
import { PatientsPageClient } from "@/components/patients/patients-page-client";
import { type Patient } from "@/types/database";

export const metadata = {
  title: "Patients Directory | Lumière Skin Clinic",
};

export default async function PatientsPage() {
  const supabase = await createClient();

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return <PatientsPageClient initialPatients={(patients as Patient[]) || []} />;
}
