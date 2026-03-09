import { fetchCryptoMarketSnapshot } from "@/lib/api/crypto";

export interface CachedCryptoMarketSnapshot {
  code: string;
  name: string;
  priceUsd: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
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

export async function getCryptoMarketWithCache(params: {
  code: string;
  name: string;
  providerId: string;
}): Promise<CachedCryptoMarketSnapshot> {
  const cacheKey = params.code;
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

    const normalized: CachedCryptoMarketSnapshot = {
      code: params.code,
      name: params.name,
      priceUsd: snapshot.priceUsd,
      change24hPct: snapshot.change24hPct,
      marketCapUsd: snapshot.marketCapUsd,
      volume24hUsd: snapshot.volume24hUsd,
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
): CachedCryptoMarketSnapshot | null {
  return marketCache.get(code)?.data ?? null;
}
