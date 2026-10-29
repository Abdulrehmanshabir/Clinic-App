import { createClient } from "@/lib/supabase/server";
import { OperatorsPageClient } from "@/components/operators/operators-page-client";
import { getCurrentProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import { type Profile } from "@/types/database";

export const metadata = {
  title: "Operators Management | Lumière Skin Clinic",
};

export default async function OperatorsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const supabase = await createClient();
  const { data: operators } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return <OperatorsPageClient initialOperators={(operators as Profile[]) || []} />;
}
