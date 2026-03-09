import { NextResponse } from "next/server";
import {
  getLastCachedRates,
  getRatesWithCache,
  RATES_CACHE_CONTROL_VALUE,
} from "@/lib/server/rates-cache";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getRatesWithCache();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": RATES_CACHE_CONTROL_VALUE
      }
    });
  } catch (error) {
    const cachedRates = getLastCachedRates();
    const fallbackErrorMessage =
      error instanceof Error
        ? error.message.replace(/[\r\n]+/g, " ")
        : "Upstream provider error";

    if (cachedRates) {
      return NextResponse.json(cachedRates, {
        status: 200,
        headers: {
          "Cache-Control": RATES_CACHE_CONTROL_VALUE,
          "X-Cache-Fallback": "stale-on-error",
          "X-Cache-Fallback-Error": fallbackErrorMessage
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
