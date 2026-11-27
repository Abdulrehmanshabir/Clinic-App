import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentProfile, getClinicSettings } from "@/lib/queries";
import { isHeadDoctorEmail } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, settings] = await Promise.all([
    getCurrentProfile(),
    getClinicSettings(),
  ]);

  // If not authenticated or profile missing, redirect
  if (!profile) {
    redirect("/login");
  }

  const isHeadDoctor = isHeadDoctorEmail(profile.email);

  // Only non-doctor operator accounts are subject to automatic deactivation lockout
  if (profile.role !== "doctor" && !isHeadDoctor && profile.is_active === false) {
    redirect("/login?error=account_deactivated");
  }

  return (
    <div className="min-h-screen bg-[#F8F5EE] dark:bg-[#0B1120] text-[#1E1915] dark:text-[#FAF7F2] flex flex-col antialiased">
      <Header
        profile={profile}
        clinicName={settings?.clinic_name || ""}
        tagline={settings?.tagline || ""}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={profile?.role || "doctor"} isHeadDoctor={isHeadDoctor} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 pb-24 md:pb-8 custom-scrollbar bg-[#F8F5EE] dark:bg-[#0B1120]">
          {children}
        </main>
      </div>
    </div>
  );
}
