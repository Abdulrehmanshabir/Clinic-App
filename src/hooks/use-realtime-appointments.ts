"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeAppointmentsProps {
  clinicDate: string;
  onUpdate: () => void;
  onCallBell?: () => void;
  onBreakBell?: () => void;
}

export function useRealtimeAppointments({
  clinicDate,
  onUpdate,
  onCallBell,
  onBreakBell,
}: UseRealtimeAppointmentsProps) {
  const onUpdateRef = useRef(onUpdate);
  const onCallBellRef = useRef(onCallBell);
  const onBreakBellRef = useRef(onBreakBell);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

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
        () => {
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
      .on("broadcast", { event: "call_bell" }, () => {
        onCallBellRef.current?.();
      })
      .on("broadcast", { event: "break_bell" }, () => {
        onBreakBellRef.current?.();
      })
      .subscribe();

    channelRef.current = appointmentChannel;

    // Gentle polling fallback (every 8s) to guarantee multi-screen sync without overloading CPU/network
    const pollInterval = setInterval(() => {
      onUpdateRef.current?.();
    }, 8000);

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

  return { sendCallBell, sendBreakBell };
}
