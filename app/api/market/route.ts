import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRatesWithCache } from "@/lib/server/rates-cache";
import {
  getCryptoMarketWithCache,
  getLastCachedCryptoMarket,
  MARKET_CACHE_CONTROL_VALUE,
} from "@/lib/server/market-cache";

const querySchema = z.object({
  code: z.string().trim().toUpperCase().min(1),
});

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryResult = querySchema.safeParse({
    code: searchParams.get("code") ?? "",
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        message:
          queryResult.error.issues[0]?.message ?? "Invalid query parameters",
      },
      {
        status: 400,
      },
    );
  }

  const { code } = queryResult.data;

  try {
    const rates = await getRatesWithCache();
    const asset = rates.assets.find((item) => item.code === code);

    if (!asset) {
      return NextResponse.json(
        { message: "Unsupported currency or asset code" },
        { status: 404 },
      );
    }

    if (asset.type !== "crypto" || !asset.providerId) {
      return NextResponse.json(
        { message: "Market data is available only for crypto assets" },
        { status: 400 },
      );
    }

    const market = await getCryptoMarketWithCache({
      code: asset.code,
      name: asset.name,
      providerId: asset.providerId,
    });

    return NextResponse.json(market, {
      status: 200,
      headers: {
        "Cache-Control": MARKET_CACHE_CONTROL_VALUE,
      },
    });
  } catch (error) {
    const fallback = getLastCachedCryptoMarket(code);

    if (fallback) {
      return NextResponse.json(fallback, {
        status: 200,
        headers: {
          "Cache-Control": MARKET_CACHE_CONTROL_VALUE,
          "X-Cache-Fallback": "stale-on-error",
        },
      });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while loading market data";

    return NextResponse.json({ message }, { status: 500 });
  }
}
