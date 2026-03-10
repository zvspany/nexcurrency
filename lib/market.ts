import { z } from "zod";

export const MARKET_CHART_RANGES = ["24h", "7d", "30d", "1y", "all"] as const;
export type MarketChartRange = (typeof MARKET_CHART_RANGES)[number];

export interface CryptoMarketResponse {
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
  source: string;
}

const pointSchema = z.object({
  timestamp: z.string(),
  priceUsd: z.number().positive(),
});

const marketResponseSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    priceUsd: z.number().positive(),
    change24hPct: z.number().nullable(),
    marketCapUsd: z.number().nullable(),
    volume24hUsd: z.number().nullable(),
    priceHistoryRange: z.enum(MARKET_CHART_RANGES),
    priceHistory: z.array(pointSchema).optional(),
    priceHistory24h: z.array(pointSchema).optional(),
    updatedAt: z.string(),
    source: z.string(),
  })
  .transform((value) => ({
    code: value.code,
    name: value.name,
    priceUsd: value.priceUsd,
    change24hPct: value.change24hPct,
    marketCapUsd: value.marketCapUsd,
    volume24hUsd: value.volume24hUsd,
    priceHistoryRange: value.priceHistoryRange,
    priceHistory: value.priceHistory ?? value.priceHistory24h ?? [],
    updatedAt: value.updatedAt,
    source: value.source,
  }));

export function parseCryptoMarketResponse(
  payload: unknown,
): CryptoMarketResponse {
  return marketResponseSchema.parse(payload);
}
