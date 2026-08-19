"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchQueue, QueueEntry } from "@/lib/queue";

export function useQueue(intervalMs = 3000) {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchQueue();
      setEntries(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => clearInterval(timer);
  }, [refresh, intervalMs]);

  return { entries, loading, error, refresh };
}
