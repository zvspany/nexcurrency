import { NextResponse } from "next/server";
import { fetchUnifiedRates } from "@/lib/api/normalize";
import type { RatesResponse } from "@/lib/rates";

const CACHE_TTL_MS = 300_000;
const CACHE_CONTROL_VALUE = "s-maxage=300, stale-while-revalidate=1800";

let cachedRates: RatesResponse | null = null;
let cacheTimestamp = 0;
let inFlightRequest: Promise<RatesResponse> | null = null;

export const revalidate = 300;

async function getRatesWithCache(): Promise<RatesResponse> {
  const now = Date.now();
  const hasFreshCache = cachedRates && now - cacheTimestamp < CACHE_TTL_MS;

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

export async function GET() {
  try {
    const data = await getRatesWithCache();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL_VALUE
      }
    });
  } catch (error) {
    if (cachedRates) {
      return NextResponse.json(cachedRates, {
        status: 200,
        headers: {
          "Cache-Control": CACHE_CONTROL_VALUE,
          "X-Cache-Fallback": "stale-on-error"
        }
      });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while loading rates";

    return NextResponse.json(
      {
        message
      },
      {
        status: 500
      }
    );
  }
}
