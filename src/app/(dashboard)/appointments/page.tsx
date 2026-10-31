import { AppointmentsPageClient } from "@/components/appointments/appointments-page-client";
import { getActiveServices, getDoctorsList, getTodayAppointments } from "@/lib/queries";
import { getTodayDateString } from "@/lib/utils";

export const metadata = {
  title: "Appointments | Glow & Derm Clinic",
};

export default async function AppointmentsPage() {
  const today = getTodayDateString();

  // Run all database calls concurrently in parallel for instant page loads
  const [services, doctors, appointments] = await Promise.all([
    getActiveServices(),
    getDoctorsList(),
    getTodayAppointments(today),
  ]);

  return (
    <AppointmentsPageClient
      initialAppointments={appointments}
      clinicDate={today}
      services={services}
      doctors={doctors}
    />
  );
}
