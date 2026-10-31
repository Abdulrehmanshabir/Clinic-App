import { getTodayDateString } from "@/lib/utils";
import {
  getTodayAppointments,
  calculateQueueSummary,
  getCurrentProfile,
  getActiveServices,
  getDoctorsList,
  getClinicSettings,
  getDoctorBreakStatus,
  getActiveSession,
} from "@/lib/queries";
import { OperatorDashboardClient } from "@/components/operator/operator-dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Reception Desk | Patient Queue System",
};

export default async function OperatorDashboardPage() {
  const today = getTodayDateString();

  // Run all independent queries in parallel for instant page transitions
  const [profile, appointments, services, doctors, settings, doctorBreak, activeSession] = await Promise.all([
    getCurrentProfile(),
    getTodayAppointments(today),
    getActiveServices(),
    getDoctorsList(),
    getClinicSettings(),
    getDoctorBreakStatus(today),
    getActiveSession(today),
  ]);

  const summary = calculateQueueSummary(appointments);

  return (
    <OperatorDashboardClient
      initialAppointments={appointments}
      summary={summary}
      clinicDate={today}
      services={services}
      doctors={doctors}
      operatorProfile={profile}
      clinicSettings={settings}
      initialDoctorBreak={doctorBreak}
      initialActiveSession={activeSession}
    />
  );
}
