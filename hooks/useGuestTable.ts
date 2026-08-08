"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "lumina.tableNumber";

export function useGuestTable() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const [tableNumber, setTableNumberState] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromQuery = tableParam ? Number(tableParam) : NaN;
    if (Number.isInteger(fromQuery) && fromQuery >= 1 && fromQuery <= 30) {
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
      if (Number.isInteger(n) && n >= 1 && n <= 30) {
        setTableNumberState(n);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [tableParam]);

  const setTableNumber = useCallback((n: number) => {
    setTableNumberState(n);
    try {
      localStorage.setItem(STORAGE_KEY, String(n));
    } catch {
      /* ignore */
    }
  }, []);

  return { tableNumber, setTableNumber, ready };
}
