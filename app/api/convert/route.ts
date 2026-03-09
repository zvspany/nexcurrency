import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { convertAmount } from "@/lib/rates";
import {
  getLastCachedRates,
  getRatesWithCache,
  RATES_CACHE_CONTROL_VALUE,
} from "@/lib/server/rates-cache";
import { amountSchema } from "@/lib/validation";

const querySchema = z.object({
  from: z.string().trim().toUpperCase().min(1),
  to: z.string().trim().toUpperCase().min(1),
  amount: amountSchema,
});

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const queryResult = querySchema.safeParse({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    amount: searchParams.get("amount") ?? "",
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        message:
          queryResult.error.issues[0]?.message ?? "Invalid query parameters",
      },
      { status: 400 },
    );
  }

  const { amount, from, to } = queryResult.data;

  try {
    const rates = await getRatesWithCache();
    const rateMap = new Map(rates.assets.map((asset) => [asset.code, asset]));

    const fromAsset = rateMap.get(from);
    const toAsset = rateMap.get(to);

    if (!fromAsset || !toAsset) {
      return NextResponse.json(
        { message: "Unsupported currency or asset code" },
        { status: 404 },
      );
    }

    const converted = convertAmount(amount, fromAsset, toAsset);
    const rate = fromAsset.usdPrice / toAsset.usdPrice;
    const inverseRate = toAsset.usdPrice / fromAsset.usdPrice;

    return NextResponse.json(
      {
        from,
        to,
        amount,
        convertedAmount: converted,
        rate,
        inverseRate,
        quoteCurrency: rates.quoteCurrency,
        updatedAt: rates.updatedAt,
        sources: rates.sources,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": RATES_CACHE_CONTROL_VALUE,
        },
      },
    );
  } catch (error) {
    const cachedRates = getLastCachedRates();

    if (cachedRates) {
      const rateMap = new Map(
        cachedRates.assets.map((asset) => [asset.code, asset]),
      );
      const fromAsset = rateMap.get(from);
      const toAsset = rateMap.get(to);

      if (fromAsset && toAsset) {
        const converted = convertAmount(amount, fromAsset, toAsset);
        const rate = fromAsset.usdPrice / toAsset.usdPrice;
        const inverseRate = toAsset.usdPrice / fromAsset.usdPrice;

        return NextResponse.json(
          {
            from,
            to,
            amount,
            convertedAmount: converted,
            rate,
            inverseRate,
            quoteCurrency: cachedRates.quoteCurrency,
            updatedAt: cachedRates.updatedAt,
            sources: cachedRates.sources,
          },
          {
            status: 200,
            headers: {
              "Cache-Control": RATES_CACHE_CONTROL_VALUE,
              "X-Cache-Fallback": "stale-on-error",
            },
          },
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while converting amount";

    return NextResponse.json({ message }, { status: 500 });
  }
}
