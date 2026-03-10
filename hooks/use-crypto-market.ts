"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildApiUrl } from "@/lib/api/url";
import {
  type MarketChartRange,
  parseCryptoMarketResponse,
  type CryptoMarketResponse,
} from "@/lib/market";

const REFRESH_INTERVAL_MS = 60_000;

export function useCryptoMarket(
  assetCode: string | null,
  range: MarketChartRange = "24h",
) {
  const [data, setData] = useState<CryptoMarketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setData(null);
    setError(null);
  }, [assetCode, range]);

  const fetchMarket = useCallback(async () => {
    if (!assetCode) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        buildApiUrl(
          `/api/market?code=${encodeURIComponent(assetCode)}&range=${encodeURIComponent(range)}`,
        ),
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        throw new Error(payload?.message ?? "Unable to fetch market data");
      }

      const payload = await response.json();
      const parsed = parseCryptoMarketResponse(payload);
      setData(parsed);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [assetCode, range]);

  useEffect(() => {
    void fetchMarket();

    if (!assetCode) {
      return;
    }

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchMarket();
      }
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchMarket();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [assetCode, range, fetchMarket]);

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      refresh: fetchMarket,
    }),
    [data, error, isLoading, fetchMarket],
  );
}
