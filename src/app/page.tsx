import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const role = profile?.role || "doctor";
  if (role === "doctor") {
    redirect("/doctor");
  } else {
    redirect("/operator");
  }
}
