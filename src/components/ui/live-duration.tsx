"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils";

interface LiveDurationProps {
  since?: string | null;
  until?: string | null;
  className?: string;
  placeholder?: string;
}

export function LiveDuration({
  since,
  until,
  className,
  placeholder = "--",
}: LiveDurationProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    if (until) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  if (!since) return <span className={className}>{placeholder}</span>;

  const startMs = new Date(since).getTime();
  if (Number.isNaN(startMs)) {
    return <span className={className}>{placeholder}</span>;
  }

  const endMs = until ? new Date(until).getTime() : now;
  if (endMs === null || Number.isNaN(endMs)) {
    return <span className={className}>{placeholder}</span>;
  }

  return (
    <span className={className}>{formatDuration(Math.max(0, endMs - startMs))}</span>
  );
}
