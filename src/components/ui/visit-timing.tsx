"use client";

import type { Appointment } from "@/types/database";
import { formatClinicClock } from "@/lib/utils";

/**
 * Returns the start time of a consultation if it exists, otherwise falls back to the
 * appointment's updated time when the status is `in_consultation`.
 */
export function getConsultationStart(app: Appointment): string | null {
  return (
    app.consultation?.started_at ||
    (app.status === "in_consultation" ? app.updated_at : null)
  );
}

/**
 * Returns the completion time of a consultation if it exists, otherwise falls back to the
 * appointment's updated time when the status is `completed`.
 */
export function getConsultationEnd(app: Appointment): string | null {
  return (
    app.consultation?.completed_at ||
    (app.status === "completed" ? app.updated_at : null)
  );
}

/**
 * UI component that shows timing information for a token/appointment.
 * The waiting line has been removed per the user's request.
 */
export function TokenTiming({ appointment }: { appointment: Appointment }) {
  if (!appointment.token) return null;

  const issuedAt = appointment.token.created_at || appointment.created_at;

  return (
    <div className="mt-1.5 space-y-0.5 text-[11px] font-bold leading-tight text-[#8C6843] dark:text-[#E5C158]">
      <div>Issued {formatClinicClock(issuedAt)}</div>
    </div>
  );
}
