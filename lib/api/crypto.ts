import { CRYPTO_ASSETS } from "@/lib/assets";

export interface CryptoRateResult {
  usdPrices: Record<string, number>;
  updatedAt: string;
}

export interface CryptoMarketSnapshot {
  priceUsd: number;
  change24hPct: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  updatedAt: string;
}

export interface CryptoPricePoint {
  timestamp: string;
  priceUsd: number;
}

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

function buildCoinGeckoHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json"
  };

  const proApiKey = process.env.COINGECKO_PRO_API_KEY?.trim();
  const demoApiKey = process.env.COINGECKO_DEMO_API_KEY?.trim();
  const genericApiKey = process.env.COINGECKO_API_KEY?.trim();
  const genericApiKeyType =
    process.env.COINGECKO_API_KEY_TYPE?.trim().toLowerCase() ?? "demo";

  if (proApiKey) {
    headers["x-cg-pro-api-key"] = proApiKey;
    return headers;
  }

  if (demoApiKey) {
    headers["x-cg-demo-api-key"] = demoApiKey;
    return headers;
  }

  if (genericApiKey) {
    if (genericApiKeyType === "pro") {
      headers["x-cg-pro-api-key"] = genericApiKey;
    } else {
      headers["x-cg-demo-api-key"] = genericApiKey;
    }
  }

  return headers;
}

export async function fetchCryptoMarketSnapshot(
  providerId: string,
): Promise<CryptoMarketSnapshot> {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(
    providerId,
  )}&price_change_percentage=24h`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: buildCoinGeckoHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Unable to load crypto market data (${response.status})`);
  }

  const payload = (await response.json()) as Array<{
    current_price?: number;
    market_cap?: number;
    total_volume?: number;
    price_change_percentage_24h?: number;
    last_updated?: string;
  }>;

  const market = payload[0];

  if (!market?.current_price || market.current_price <= 0) {
    throw new Error("Crypto market data is unavailable");
  }

  return {
    priceUsd: market.current_price,
    change24hPct:
      typeof market.price_change_percentage_24h === "number"
        ? market.price_change_percentage_24h
        : null,
    marketCapUsd:
      typeof market.market_cap === "number" ? market.market_cap : null,
    volume24hUsd:
      typeof market.total_volume === "number" ? market.total_volume : null,
    updatedAt: market.last_updated ?? new Date().toISOString(),
  };
}

export async function fetchCryptoPriceHistory24h(
  providerId: string,
): Promise<CryptoPricePoint[]> {
  const url = `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(
    providerId,
  )}/market_chart?vs_currency=usd&days=1`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: buildCoinGeckoHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Unable to load crypto price history (${response.status})`);
  }

  const payload = (await response.json()) as {
    prices?: Array<[number, number]>;
  };

  const points = (payload.prices ?? [])
    .filter(
      (entry): entry is [number, number] =>
        Array.isArray(entry) &&
        entry.length >= 2 &&
        Number.isFinite(entry[0]) &&
        Number.isFinite(entry[1]) &&
        entry[1] > 0,
    )
    .map(([timestamp, priceUsd]) => ({
      timestamp: new Date(timestamp).toISOString(),
      priceUsd,
    }));

  return points;
}

export async function fetchCryptoData(): Promise<CryptoRateResult> {
  const ids = CRYPTO_ASSETS.map((asset) => asset.providerId).filter(
    (id): id is string => Boolean(id)
  );

  const url = `${COINGECKO_BASE_URL}/simple/price?ids=${encodeURIComponent(
    ids.join(",")
  )}&vs_currencies=usd&include_last_updated_at=true`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: buildCoinGeckoHeaders()
  });

  if (!response.ok) {
    throw new Error(`Unable to load crypto rates (${response.status})`);
  }

  const payload = (await response.json()) as Record<
    string,
    {
      usd?: number;
      last_updated_at?: number;
    }
  >;

  const usdPrices: Record<string, number> = {};
  let mostRecentUpdate = 0;

  for (const asset of CRYPTO_ASSETS) {
    if (!asset.providerId) {
      continue;
    }

    const entry = payload[asset.providerId];

    if (!entry?.usd || entry.usd <= 0) {
      continue;
    }

    usdPrices[asset.code] = entry.usd;

    if (entry.last_updated_at && entry.last_updated_at > mostRecentUpdate) {
      mostRecentUpdate = entry.last_updated_at;
    }
  }

  return {
    usdPrices,
    updatedAt:
      mostRecentUpdate > 0
        ? new Date(mostRecentUpdate * 1000).toISOString()
        : new Date().toISOString()
  };
}
