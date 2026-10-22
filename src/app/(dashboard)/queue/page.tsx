import { getTodayDateString } from "@/lib/utils";
import { getTodayAppointments } from "@/lib/queries";
import { QueuePageClient } from "@/components/queue/queue-page-client";

export const metadata = {
  title: "Live Queue | Lumière Skin Clinic",
};

export default async function QueuePage() {
  const today = getTodayDateString();
  const appointments = await getTodayAppointments(today);

  return (
    <QueuePageClient
      initialAppointments={appointments}
      clinicDate={today}
    />
  );
}
