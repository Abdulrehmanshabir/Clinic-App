import { createClient } from "@/lib/supabase/server";
import { OperatorsPageClient } from "@/components/operators/operators-page-client";
import { getClinicSettings, getCurrentProfile } from "@/lib/queries";
import { isHeadDoctorEmail } from "@/lib/roles";
import { getTodayDateString } from "@/lib/utils";
import { redirect } from "next/navigation";
import { type Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operators Management | Lumière Skin Clinic",
};

export default async function OperatorsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor" || !isHeadDoctorEmail(profile.email)) {
    redirect(profile?.role === "doctor" ? "/doctor" : "/operator");
  }

  const supabase = await createClient();
  const { data: operators } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "operator")
    .order("created_at", { ascending: false });

  const staff = ((operators as Profile[]) || []).filter(
    (member) => !isHeadDoctorEmail(member.email)
  );
  const clinicSettings = await getClinicSettings();

  return (
    <OperatorsPageClient
      initialOperators={staff}
      clinicSettings={clinicSettings}
      clinicDate={getTodayDateString()}
    />
  );
}
