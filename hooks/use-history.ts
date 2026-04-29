"use client";

import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: Record<string, unknown>;
  preview: string;
}

const MAX_ENTRIES = 20;

export function useHistory(feature: string) {
  const key = `firescraper-history-${feature}`;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, [key]);

  const addEntry = useCallback(
    (input: Record<string, unknown>, preview: string) => {
      setEntries((prev) => {
        const next = [
          { id: crypto.randomUUID(), timestamp: Date.now(), input, preview },
          ...prev,
        ].slice(0, MAX_ENTRIES);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(key);
  }, [key]);

  return { entries, addEntry, clearHistory };
}
