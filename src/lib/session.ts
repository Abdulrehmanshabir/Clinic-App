import type { AppointmentStatus, ClinicShift } from "@/types/database";

export const EVENING_SESSION_START_HOUR = 18;

export const SHIFT_LABELS: Record<ClinicShift, string> = {
  morning: "Morning",
  evening: "Evening",
};

export const SHIFT_TOKEN_PREFIX: Record<ClinicShift, string> = {
  morning: "M-",
  evening: "E-",
};

export function isClinicShift(value: unknown): value is ClinicShift {
  return value === "morning" || value === "evening";
}

export function getShiftTokenPrefix(shift: ClinicShift): string {
  return SHIFT_TOKEN_PREFIX[shift];
}

export function getShiftFromToken(
  tokenNumber: string | null | undefined
): ClinicShift | null {
  if (!tokenNumber) return null;
  const normalized = tokenNumber.trim().toUpperCase();
  if (normalized.startsWith("E-")) return "evening";
  if (normalized.startsWith("M-")) return "morning";
  return null;
}

export function getShiftFromTime(
  timeStr: string | null | undefined
): ClinicShift {
  if (!timeStr) return "morning";
  const hour = parseInt(timeStr.split(":")[0] ?? "", 10);
  if (Number.isNaN(hour)) return "morning";
  return hour >= EVENING_SESSION_START_HOUR ? "evening" : "morning";
}

export function getShiftFromNotes(
  notes: string | null | undefined
): ClinicShift | null {
  if (!notes) return null;
  const match = notes.match(/\[SHIFT:(MORNING|EVENING)\]/i);
  if (!match) return null;
  return match[1].toUpperCase() === "EVENING" ? "evening" : "morning";
}

export function getShiftTag(shift: ClinicShift): string {
  return `[SHIFT:${shift.toUpperCase()}]`;
}

export function appendShiftTag(
  notes: string | null | undefined,
  shift: ClinicShift
): string {
  const cleaned = (notes || "").replace(/\[SHIFT:(MORNING|EVENING)\]/gi, "").trim();
  return [cleaned, getShiftTag(shift)].filter(Boolean).join(" ");
}

export function getAppointmentShift(appointment: {
  appointment_time: string;
  notes?: string | null;
  token?: { token_number: string } | null;
}): ClinicShift {
  return (
    getShiftFromToken(appointment.token?.token_number) ??
    getShiftFromNotes(appointment.notes) ??
    getShiftFromTime(appointment.appointment_time)
  );
}

export function isActiveAppointmentStatus(status: AppointmentStatus): boolean {
  return (
    status === "waiting" ||
    status === "called" ||
    status === "in_consultation"
  );
}

export function filterAppointmentsForShift<
  T extends { appointment_time: string; notes?: string | null; token?: { token_number: string } | null },
>(appointments: T[], shift: ClinicShift): T[] {
  return appointments.filter(
    (appointment) => getAppointmentShift(appointment) === shift
  );
}
