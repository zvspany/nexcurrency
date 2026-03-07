export interface FiatRateResult {
  currencyNames: Record<string, string>;
  usdRates: Record<string, number>;
  updatedAt: string;
}

const FRANKFURTER_BASE_URL = "https://api.frankfurter.app";

export async function fetchFiatData(): Promise<FiatRateResult> {
  const [currenciesRes, latestRes] = await Promise.all([
    fetch(`${FRANKFURTER_BASE_URL}/currencies`, {
      next: { revalidate: 60 }
    }),
    fetch(`${FRANKFURTER_BASE_URL}/latest?from=USD`, {
      next: { revalidate: 60 }
    })
  ]);

  if (!currenciesRes.ok) {
    throw new Error(`Unable to load fiat currency names (${currenciesRes.status})`);
  }

  if (!latestRes.ok) {
    throw new Error(`Unable to load fiat rates (${latestRes.status})`);
  }

  const currencyNames = (await currenciesRes.json()) as Record<string, string>;
  const latest = (await latestRes.json()) as {
    date: string;
    rates: Record<string, number>;
  };

  const usdRates: Record<string, number> = {
    USD: 1,
    ...latest.rates
  };

  return {
    currencyNames,
    usdRates,
    updatedAt: new Date(`${latest.date}T00:00:00Z`).toISOString()
  };
}
