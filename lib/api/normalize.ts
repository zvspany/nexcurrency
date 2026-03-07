import { buildAllAssets } from "@/lib/assets";
import { fetchCryptoData } from "@/lib/api/crypto";
import { fetchFiatData } from "@/lib/api/fiat";
import { RateAsset, RatesResponse } from "@/lib/rates";

function normalizeFiatUsdPrice(usdRate: number): number {
  return 1 / usdRate;
}

export async function fetchUnifiedRates(): Promise<RatesResponse> {
  const [fiat, crypto] = await Promise.all([fetchFiatData(), fetchCryptoData()]);
  const assetDefinitions = buildAllAssets(fiat.currencyNames);

  const assets: RateAsset[] = [];

  for (const asset of assetDefinitions) {
    if (asset.type === "fiat") {
      const usdRate = fiat.usdRates[asset.code];

      if (!usdRate || usdRate <= 0) {
        continue;
      }

      assets.push({
        ...asset,
        usdPrice: normalizeFiatUsdPrice(usdRate),
        updatedAt: fiat.updatedAt
      });

      continue;
    }

    const usdPrice = crypto.usdPrices[asset.code];

    if (!usdPrice || usdPrice <= 0) {
      continue;
    }

    assets.push({
      ...asset,
      usdPrice,
      updatedAt: crypto.updatedAt
    });
  }

  const fiatUpdated = new Date(fiat.updatedAt).getTime();
  const cryptoUpdated = new Date(crypto.updatedAt).getTime();

  return {
    assets,
    quoteCurrency: "USD",
    updatedAt: new Date(Math.max(fiatUpdated, cryptoUpdated)).toISOString(),
    sources: {
      fiat: "Frankfurter",
      crypto: "CoinGecko"
    }
  };
}
