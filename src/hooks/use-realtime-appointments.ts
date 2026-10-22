"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeAppointmentsProps {
  clinicDate: string;
  onUpdate: () => void;
}

export function useRealtimeAppointments({ clinicDate, onUpdate }: UseRealtimeAppointmentsProps) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

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

    // Gentle polling fallback (every 8s) to guarantee multi-screen sync without overloading CPU/network
    const pollInterval = setInterval(() => {
      onUpdateRef.current?.();
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(appointmentChannel);
    };
  }, [clinicDate]);
}
