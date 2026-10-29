import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Appointment, AppointmentStatus } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatClinicDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "N/A";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatClinicTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "--:--";
  // If time string in HH:MM:SS or HH:MM
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${strHours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

export function isOnlineAppointment(
  app: Pick<Appointment, "is_online" | "notes"> | null | undefined
): boolean {
  if (!app) return false;
  return app.is_online === true || (app.notes?.includes("[ONLINE]") ?? false);
}

export function isProcedureAppointment(
  app: Pick<Appointment, "service_id" | "service"> | null | undefined
): boolean {
  if (!app) return false;
  return app.service_id != null || app.service != null;
}

const APPOINTMENT_STATUS_PRIORITY: Record<AppointmentStatus, number> = {
  in_consultation: 0,
  called: 1,
  waiting: 2,
  completed: 3,
  cancelled: 4,
  no_show: 5,
};

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortAppointmentsForDashboard(
  appointments: Appointment[]
): Appointment[] {
  return [...appointments].sort((a, b) => {
    const priorityDiff =
      APPOINTMENT_STATUS_PRIORITY[a.status] -
      APPOINTMENT_STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.status === "completed") {
      const completedDiff =
        toTimestamp(b.consultation?.completed_at ?? b.updated_at) -
        toTimestamp(a.consultation?.completed_at ?? a.updated_at);
      if (completedDiff !== 0) return completedDiff;
    }

    if (a.status === "cancelled" || a.status === "no_show") {
      const updatedDiff =
        toTimestamp(b.updated_at) - toTimestamp(a.updated_at);
      if (updatedDiff !== 0) return updatedDiff;
    }

    const queueDiff =
      (a.token?.queue_position ?? Number.MAX_SAFE_INTEGER) -
      (b.token?.queue_position ?? Number.MAX_SAFE_INTEGER);
    if (queueDiff !== 0) return queueDiff;

    return (
      a.appointment_time.localeCompare(b.appointment_time) ||
      a.created_at.localeCompare(b.created_at)
    );
  });
}

export const CLINIC_TIME_ZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE || "Asia/Karachi";

export function getClinicDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return getClinicDateString();
}
