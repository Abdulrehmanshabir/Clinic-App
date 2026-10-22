import { getTodayDateString } from "@/lib/utils";
import { getTodayAppointments, calculateQueueSummary, getCurrentProfile, getDoctorBreakStatus, getActiveServices } from "@/lib/queries";
import { DoctorDashboardClient } from "@/components/doctor/doctor-dashboard-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Doctor Console | Lumière Skin Clinic",
};

export default async function DoctorDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const today = getTodayDateString();
  const [appointments, doctorBreak, services] = await Promise.all([
    getTodayAppointments(today),
    getDoctorBreakStatus(today),
    getActiveServices(),
  ]);
  const summary = calculateQueueSummary(appointments);

  return (
    <DoctorDashboardClient
      initialAppointments={appointments}
      summary={summary}
      clinicDate={today}
      doctorProfile={profile}
      initialDoctorBreak={doctorBreak}
      services={services}
    />
  );
}
