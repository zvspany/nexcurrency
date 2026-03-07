"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { parseRatesResponse, RatesResponse } from "@/lib/rates";

const REFRESH_INTERVAL_MS = 60_000;

function buildApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, "")}${path}`;
}

export function useMarketRates() {
  const [data, setData] = useState<RatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/api/rates"));

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        throw new Error(
          payload?.message ?? "Unable to fetch latest market rates",
        );
      }

      const payload = await response.json();
      const parsed = parseRatesResponse(payload);

      setData(parsed);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRates();

    const tick = () => {
      if (document.visibilityState === "visible") {
        void fetchRates();
      }
    };

    const id = window.setInterval(() => {
      tick();
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchRates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRates]);

  const state = useMemo(
    () => ({
      data,
      error,
      isLoading,
      refresh: fetchRates,
    }),
    [data, error, isLoading, fetchRates],
  );

  return state;
}
