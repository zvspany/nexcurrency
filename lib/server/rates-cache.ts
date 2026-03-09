import { fetchUnifiedRates } from "@/lib/api/normalize";
import type { RatesResponse } from "@/lib/rates";

export const RATES_CACHE_TTL_MS = 300_000;
export const RATES_CACHE_CONTROL_VALUE =
  "s-maxage=300, stale-while-revalidate=1800";

let cachedRates: RatesResponse | null = null;
let cacheTimestamp = 0;
let inFlightRequest: Promise<RatesResponse> | null = null;

export async function getRatesWithCache(): Promise<RatesResponse> {
  const now = Date.now();
  const hasFreshCache = cachedRates && now - cacheTimestamp < RATES_CACHE_TTL_MS;

  if (hasFreshCache && cachedRates) {
    return cachedRates;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    const freshRates = await fetchUnifiedRates();
    cachedRates = freshRates;
    cacheTimestamp = Date.now();
    return freshRates;
  })();

  try {
    return await inFlightRequest;
  } finally {
    inFlightRequest = null;
  }
}

export function getLastCachedRates(): RatesResponse | null {
  return cachedRates;
}
