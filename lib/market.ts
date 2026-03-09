import { z } from "zod";

export interface CryptoMarketResponse {
  code: string;
  name: string;
  priceUsd: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  updatedAt: string;
  source: string;
}

const marketResponseSchema = z.object({
  code: z.string(),
  name: z.string(),
  priceUsd: z.number().positive(),
  change24hPct: z.number().nullable(),
  marketCapUsd: z.number().nullable(),
  volume24hUsd: z.number().nullable(),
  updatedAt: z.string(),
  source: z.string(),
});

export function parseCryptoMarketResponse(
  payload: unknown,
): CryptoMarketResponse {
  return marketResponseSchema.parse(payload);
}
