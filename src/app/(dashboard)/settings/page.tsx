import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "@/components/settings/settings-page-client";
import { getCurrentProfile } from "@/lib/queries";
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
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return <SettingsPageClient initialServices={(services as Service[]) || []} />;
}
