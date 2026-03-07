import { CRYPTO_ASSETS } from "@/lib/assets";

export interface CryptoRateResult {
  usdPrices: Record<string, number>;
  updatedAt: string;
}

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

export async function fetchCryptoData(): Promise<CryptoRateResult> {
  const ids = CRYPTO_ASSETS.map((asset) => asset.providerId).filter(
    (id): id is string => Boolean(id)
  );

  const url = `${COINGECKO_BASE_URL}/simple/price?ids=${encodeURIComponent(
    ids.join(",")
  )}&vs_currencies=usd&include_last_updated_at=true`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: {
      accept: "application/json"
    }
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
