import { getTodayDateString } from "@/lib/utils";
import { getTodayAppointments, calculateQueueSummary, getClinicDayStatus, getCurrentProfile } from "@/lib/queries";
import { HistoryPageClient } from "@/components/history/history-page-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Date History & Closing | Lumière Skin Clinic",
};

interface HistoryPageProps {
  searchParams: {
    date?: string;
  };
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "doctor") {
    redirect("/operator");
  }

  const selectedDate = searchParams?.date || getTodayDateString();
  const appointments = await getTodayAppointments(selectedDate);
  const summary = calculateQueueSummary(appointments);
  const clinicDay = await getClinicDayStatus(selectedDate);

  return (
    <HistoryPageClient
      initialAppointments={appointments}
      initialSummary={summary}
      initialClinicDay={clinicDay}
      selectedDate={selectedDate}
    />
  );
}
