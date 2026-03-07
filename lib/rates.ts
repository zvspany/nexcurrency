import { z } from "zod";
import { AssetDefinition } from "@/lib/assets";

export interface RateAsset extends AssetDefinition {
  usdPrice: number;
  updatedAt: string;
}

export interface RatesResponse {
  assets: RateAsset[];
  quoteCurrency: "USD";
  updatedAt: string;
  sources: {
    fiat: string;
    crypto: string;
  };
}

const rateAssetSchema = z.object({
  code: z.string(),
  name: z.string(),
  type: z.enum(["fiat", "crypto"]),
  symbol: z.string().optional(),
  providerId: z.string().optional(),
  popular: z.boolean().optional(),
  decimals: z.number().optional(),
  usdPrice: z.number().positive(),
  updatedAt: z.string()
});

const ratesResponseSchema = z.object({
  assets: z.array(rateAssetSchema),
  quoteCurrency: z.literal("USD"),
  updatedAt: z.string(),
  sources: z.object({
    fiat: z.string(),
    crypto: z.string()
  })
});

export function parseRatesResponse(payload: unknown): RatesResponse {
  return ratesResponseSchema.parse(payload);
}

export function buildRateMap(assets: RateAsset[]): Map<string, RateAsset> {
  return new Map(assets.map((asset) => [asset.code, asset]));
}

export function convertAmount(
  amount: number,
  fromAsset: RateAsset,
  toAsset: RateAsset
): number {
  return amount * (fromAsset.usdPrice / toAsset.usdPrice);
}
