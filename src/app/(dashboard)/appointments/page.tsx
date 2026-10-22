import { createClient } from "@/lib/supabase/server";
import { AppointmentsPageClient } from "@/components/appointments/appointments-page-client";
import { getActiveServices, getDoctorsList } from "@/lib/queries";
import { type Appointment } from "@/types/database";

export const metadata = {
  title: "Appointments | Glow & Derm Clinic",
};

export default async function AppointmentsPage() {
  const supabase = await createClient();

  // Run all database calls concurrently in parallel for instant page loads
  const [services, doctors, appointmentsResult] = await Promise.all([
    getActiveServices(),
    getDoctorsList(),
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        appointment_type,
        status,
        patient:patients (
          id,
          patient_number,
          full_name,
          phone
        ),
        token:tokens (
          id,
          token_number,
          queue_position
        ),
        service:services (
          id,
          name,
          duration_minutes,
          price
        ),
        doctor:profiles!appointments_doctor_id_fkey (
          id,
          full_name
        )
      `)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: true })
      .limit(100),
  ]);

  return (
    <AppointmentsPageClient
      initialAppointments={(appointmentsResult.data as unknown as Appointment[]) || []}
      services={services}
      doctors={doctors}
    />
  );
}
