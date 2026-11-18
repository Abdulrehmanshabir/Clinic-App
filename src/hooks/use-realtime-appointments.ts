"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentStatus } from "@/types/database";

export interface RealtimeStatusPayload {
  appointmentId: string;
  status: AppointmentStatus;
  completed_at?: string;
  updated_at?: string;
}

interface UseRealtimeAppointmentsProps {
  clinicDate: string;
  onUpdate: () => void;
  onStatusChange?: (payload: RealtimeStatusPayload) => void;
  onCallBell?: () => void;
  onBreakBell?: () => void;
}

export function useRealtimeAppointments({
  clinicDate,
  onUpdate,
  onStatusChange,
  onCallBell,
  onBreakBell,
}: UseRealtimeAppointmentsProps) {
  const onUpdateRef = useRef(onUpdate);
  const onStatusChangeRef = useRef(onStatusChange);
  const onCallBellRef = useRef(onCallBell);
  const onBreakBellRef = useRef(onBreakBell);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    onCallBellRef.current = onCallBell;
  }, [onCallBell]);

  useEffect(() => {
    onBreakBellRef.current = onBreakBell;
  }, [onBreakBell]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes in appointments table for the target date
    const appointmentChannel = supabase
      .channel(`appointments-live-${clinicDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
            const newRow = payload.new as { id: string; status: AppointmentStatus; updated_at?: string };
            onStatusChangeRef.current?.({
              appointmentId: newRow.id,
              status: newRow.status,
              updated_at: newRow.updated_at,
            });
          }
          onUpdateRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
        },
        () => {
          onUpdateRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consultations",
        },
        () => {
          onUpdateRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinic_days",
        },
        () => {
          onUpdateRef.current?.();
        }
      )
      .on("broadcast", { event: "status_change" }, ({ payload }) => {
        if (payload?.appointmentId && payload?.status) {
          onStatusChangeRef.current?.(payload as RealtimeStatusPayload);
        }
        onUpdateRef.current?.();
      })
      .on("broadcast", { event: "call_bell" }, () => {
        onCallBellRef.current?.();
      })
      .on("broadcast", { event: "break_bell" }, () => {
        onBreakBellRef.current?.();
      })
      .subscribe();

    channelRef.current = appointmentChannel;

    // Polling fallback (every 4s) to guarantee multi-screen sync without overloading CPU/network
    const pollInterval = setInterval(() => {
      onUpdateRef.current?.();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
      channelRef.current = null;
      supabase.removeChannel(appointmentChannel);
    };
  }, [clinicDate]);

  const sendCallBell = useCallback((payload: { token?: string; patient?: string }) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: "broadcast", event: "call_bell", payload });
  }, []);

  const sendBreakBell = useCallback((payload: { breakType?: string; doctorName?: string }) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: "broadcast", event: "break_bell", payload });
  }, []);

  const sendStatusChange = useCallback((payload: RealtimeStatusPayload) => {
    const channel = channelRef.current;
    if (!channel) return;
    void channel.send({ type: "broadcast", event: "status_change", payload });
  }, []);

  return { sendCallBell, sendBreakBell, sendStatusChange };
}
