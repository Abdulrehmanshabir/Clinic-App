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

type BellEvent = "call_bell" | "break_bell";

export function useRealtimeAppointments({
  clinicDate,
  onUpdate,
  onCallBell,
  onBreakBell,
}: UseRealtimeAppointmentsProps) {
  const onUpdateRef = useRef(onUpdate);
  const onCallBellRef = useRef(onCallBell);
  const onBreakBellRef = useRef(onBreakBell);
  const bellChannelRef = useRef<RealtimeChannel | null>(null);
  const bellReadyRef = useRef(false);
  const pendingBellsRef = useRef<Array<{ event: BellEvent; payload: unknown }>>([]);

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
      .subscribe();

    // Dedicated broadcast channel so bells always reach every open device,
    // independent of the postgres-changes channel.
    const bellChannel = supabase
      .channel(`clinic-bells-${clinicDate}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "call_bell" }, () => {
        onCallBellRef.current?.();
      })
      .on("broadcast", { event: "break_bell" }, () => {
        onBreakBellRef.current?.();
      })
      .subscribe((status) => {
        bellReadyRef.current = status === "SUBSCRIBED";

        if (!bellReadyRef.current) return;

        // Flush any bells requested before the channel finished joining
        const queued = pendingBellsRef.current;
        pendingBellsRef.current = [];
        for (const item of queued) {
          void bellChannel.send({
            type: "broadcast",
            event: item.event,
            payload: item.payload,
          });
        }
      });

    bellChannelRef.current = bellChannel;

    // Gentle polling fallback (every 8s) to guarantee multi-screen sync without overloading CPU/network
    const pollInterval = setInterval(() => {
      onUpdateRef.current?.();
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      bellReadyRef.current = false;
      pendingBellsRef.current = [];
      bellChannelRef.current = null;
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(bellChannel);
    };
  }, [clinicDate]);

  const sendBell = useCallback((event: BellEvent, payload: unknown) => {
    const channel = bellChannelRef.current;

    // If the channel is still joining (common on mobile after sleep/refresh),
    // queue the bell instead of dropping it silently.
    if (!channel || !bellReadyRef.current) {
      if (pendingBellsRef.current.length < 20) {
        pendingBellsRef.current.push({ event, payload });
      }
      return;
    }

    void channel.send({ type: "broadcast", event, payload });
  }, []);

  const sendCallBell = useCallback(
    (payload: { token?: string; patient?: string }) => {
      sendBell("call_bell", payload);
    },
    [sendBell]
  );

  const sendBreakBell = useCallback(
    (payload: { breakType?: string; doctorName?: string }) => {
      sendBell("break_bell", payload);
    },
    [sendBell]
  );

  return { sendCallBell, sendBreakBell };
}
