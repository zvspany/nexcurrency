import {
  fetchCryptoMarketSnapshot,
  fetchCryptoPriceHistory,
} from "@/lib/api/crypto";
import type { MarketChartRange } from "@/lib/market";

export interface CachedCryptoMarketSnapshot {
  code: string;
  name: string;
  priceUsd: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  priceHistoryRange: MarketChartRange;
  priceHistory: Array<{
    timestamp: string;
    priceUsd: number;
  }>;
  updatedAt: string;
  source: "CoinGecko";
}

interface CacheEntry {
  data: CachedCryptoMarketSnapshot;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000;
export const MARKET_CACHE_CONTROL_VALUE =
  "s-maxage=60, stale-while-revalidate=600";

const marketCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<CachedCryptoMarketSnapshot>>();

function downsamplePriceHistory(
  points: Array<{ timestamp: string; priceUsd: number }>,
  maxPoints: number,
): Array<{ timestamp: string; priceUsd: number }> {
  if (points.length <= maxPoints) {
    return points;
  }

  const sampled: Array<{ timestamp: string; priceUsd: number }> = [];
  const lastIndex = points.length - 1;
  const step = lastIndex / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    const sourceIndex = Math.round(index * step);
    sampled.push(points[Math.min(sourceIndex, lastIndex)]);
  }

  return sampled;
}

export async function getCryptoMarketWithCache(params: {
  code: string;
  name: string;
  providerId: string;
  range: MarketChartRange;
}): Promise<CachedCryptoMarketSnapshot> {
  const cacheKey = `${params.code}:${params.range}`;
  const cached = marketCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const pending = inFlightRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  const requestPromise = (async () => {
    const snapshot = await fetchCryptoMarketSnapshot(params.providerId);
    let history: Array<{ timestamp: string; priceUsd: number }> = [];

    try {
      history = await fetchCryptoPriceHistory(params.providerId, params.range);
      history = downsamplePriceHistory(history, 180);
    } catch {
      history = [];
    }

    const normalized: CachedCryptoMarketSnapshot = {
      code: params.code,
      name: params.name,
      priceUsd: snapshot.priceUsd,
      change24hPct: snapshot.change24hPct,
      marketCapUsd: snapshot.marketCapUsd,
      volume24hUsd: snapshot.volume24hUsd,
      priceHistoryRange: params.range,
      priceHistory: history,
      updatedAt: snapshot.updatedAt,
      source: "CoinGecko",
    };

    marketCache.set(cacheKey, {
      data: normalized,
      timestamp: Date.now(),
    });

    return normalized;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

export function getLastCachedCryptoMarket(
  code: string,
  range: MarketChartRange,
): CachedCryptoMarketSnapshot | null {
  return marketCache.get(`${code}:${range}`)?.data ?? null;
}
