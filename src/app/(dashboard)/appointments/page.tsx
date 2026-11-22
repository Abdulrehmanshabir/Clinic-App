import { AppointmentsPageClient } from "@/components/appointments/appointments-page-client";
import { getActiveServices, getDoctorsList, getTodayAppointments, getActiveSession, getCurrentProfile } from "@/lib/queries";
import { isHeadDoctorEmail } from "@/lib/roles";
import { getTodayDateString } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Appointments | Glow & Derm Clinic",
};

export default async function AppointmentsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Only the main (head) doctor and reception operators can view appointments.
  // Secondary / assistant doctors are restricted.
  if (profile.role === "doctor" && !isHeadDoctorEmail(profile.email)) {
    redirect("/doctor");
  }

  const today = getTodayDateString();

  // Run all database calls concurrently in parallel for instant page loads
  const [services, doctors, appointments, activeSession] = await Promise.all([
    getActiveServices(),
    getDoctorsList(),
    getTodayAppointments(today),
    getActiveSession(today),
  ]);

  return (
    <AppointmentsPageClient
      initialAppointments={appointments}
      clinicDate={today}
      initialActiveSession={activeSession}
      services={services}
      doctors={doctors}
    />
  );
}
