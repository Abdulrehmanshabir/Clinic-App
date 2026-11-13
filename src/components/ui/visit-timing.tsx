"use client";

import type { Appointment } from "@/types/database";
import { formatClinicClock, formatDuration, getVisitDurationMs } from "@/lib/utils";
import { LiveDuration } from "@/components/ui/live-duration";

export function getConsultationStart(app: Appointment): string | null {
  return (
    app.consultation?.started_at ||
    (app.status === "in_consultation" ? app.updated_at : null)
  );
}

export function TokenTiming({ appointment }: { appointment: Appointment }) {
  if (!appointment.token) return null;

  const issuedAt = appointment.token.created_at || appointment.created_at;
  const startedAt = getConsultationStart(appointment);
  const completedAt =
    appointment.consultation?.completed_at ||
    (appointment.status === "completed" ? appointment.updated_at : null);
  const isWaiting =
    appointment.status === "waiting" || appointment.status === "called";

  return (
    <div className="mt-1.5 space-y-0.5 text-[11px] font-bold leading-tight text-[#8C6843] dark:text-[#E5C158]">
      <div>Issued {formatClinicClock(issuedAt)}</div>
      {isWaiting && (
        <div className="text-[#B45309] dark:text-[#FCD34D]">
          Waiting <LiveDuration since={issuedAt} />
        </div>
      )}
      {appointment.status === "in_consultation" && startedAt && (
        <div className="text-[#7E22CE] dark:text-[#C4B5FD]">
          In room {formatClinicClock(startedAt)} ·{" "}
          <LiveDuration since={startedAt} />
        </div>
      )}
      {appointment.status === "completed" && startedAt && completedAt && (
        <>
          <div>
            {formatClinicClock(startedAt)} → {formatClinicClock(completedAt)}
          </div>
          <div className="text-[#15803D] dark:text-[#4ADE80]">
            Total {formatDuration(getVisitDurationMs(startedAt, completedAt))}
          </div>
        </>
      )}
    </div>
  );
}
