import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { getClinicSettings, getCurrentProfile } from "@/lib/queries";
import { getTodayDateString } from "@/lib/utils";
import { redirect } from "next/navigation";
import { type Service } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Procedure Setting | Lumière Skin Clinic",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const supabase = await createClient();
  const [servicesResult, clinicSettings] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    getClinicSettings(),
  ]);

  return (
    <SettingsPageClient
      initialServices={(servicesResult.data as Service[]) || []}
      clinicSettings={clinicSettings}
      clinicDate={getTodayDateString()}
    />
  );
}
