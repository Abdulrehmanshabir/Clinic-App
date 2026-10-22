import { getAllServices, getCurrentProfile } from "@/lib/queries";
import { ServicesPageClient } from "@/components/services/services-page-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Clinical Services | Lumière Skin Clinic",
};

export default async function ServicesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const services = await getAllServices();

  return <ServicesPageClient initialServices={services} />;
}
