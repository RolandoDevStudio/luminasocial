"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "lumina.tableNumber";
const ABS_MAX = 100;

export function useGuestTable(maxTable = 30) {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const [tableNumber, setTableNumberState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const max = Math.min(ABS_MAX, Math.max(1, maxTable || 30));

  useEffect(() => {
    const fromQuery = tableParam ? Number(tableParam) : NaN;
    if (Number.isInteger(fromQuery) && fromQuery >= 1 && fromQuery <= max) {
      setTableNumberState(fromQuery);
      try {
        localStorage.setItem(STORAGE_KEY, String(fromQuery));
      } catch {
        /* ignore */
      }
      setReady(true);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const n = raw ? Number(raw) : NaN;
      if (Number.isInteger(n) && n >= 1 && n <= max) {
        setTableNumberState(n);
      } else if (Number.isInteger(n) && n > max) {
        // Stored table exceeds this event's count — clear selection
        setTableNumberState(null);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [tableParam, max]);

  const setTableNumber = useCallback(
    (n: number) => {
      if (!Number.isInteger(n) || n < 1 || n > max) return;
      setTableNumberState(n);
      try {
        localStorage.setItem(STORAGE_KEY, String(n));
      } catch {
        /* ignore */
      }
    },
    [max],
  );

  return { tableNumber, setTableNumber, ready, maxTable: max };
}
