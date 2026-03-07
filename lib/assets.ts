export type AssetType = "fiat" | "crypto";

export interface AssetDefinition {
  code: string;
  name: string;
  type: AssetType;
  symbol?: string;
  providerId?: string;
  popular?: boolean;
  decimals?: number;
}

export const POPULAR_CODES = [
  "USD",
  "EUR",
  "GBP",
  "PLN",
  "CHF",
  "JPY",
  "BTC",
  "ETH",
  "LTC",
  "XMR",
  "SOL",
  "USDT"
] as const;

export const POPULAR_CODE_SET = new Set<string>(POPULAR_CODES);

export const FALLBACK_FIAT_CURRENCIES: Record<string, { name: string; symbol?: string }> = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "EUR" },
  GBP: { name: "British Pound", symbol: "GBP" },
  PLN: { name: "Polish Zloty", symbol: "PLN" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  JPY: { name: "Japanese Yen", symbol: "JPY" },
  CAD: { name: "Canadian Dollar", symbol: "CAD" },
  AUD: { name: "Australian Dollar", symbol: "AUD" },
  NZD: { name: "New Zealand Dollar", symbol: "NZD" },
  SEK: { name: "Swedish Krona", symbol: "SEK" },
  NOK: { name: "Norwegian Krone", symbol: "NOK" },
  DKK: { name: "Danish Krone", symbol: "DKK" },
  CZK: { name: "Czech Koruna", symbol: "CZK" },
  HUF: { name: "Hungarian Forint", symbol: "HUF" },
  RON: { name: "Romanian Leu", symbol: "RON" },
  BGN: { name: "Bulgarian Lev", symbol: "BGN" },
  CNY: { name: "Chinese Yuan", symbol: "CNY" },
  HKD: { name: "Hong Kong Dollar", symbol: "HKD" },
  SGD: { name: "Singapore Dollar", symbol: "SGD" },
  INR: { name: "Indian Rupee", symbol: "INR" },
  KRW: { name: "South Korean Won", symbol: "KRW" },
  TRY: { name: "Turkish Lira", symbol: "TRY" },
  BRL: { name: "Brazilian Real", symbol: "BRL" },
  MXN: { name: "Mexican Peso", symbol: "MXN" },
  ZAR: { name: "South African Rand", symbol: "ZAR" },
  AED: { name: "UAE Dirham", symbol: "AED" },
  SAR: { name: "Saudi Riyal", symbol: "SAR" },
  ILS: { name: "Israeli New Shekel", symbol: "ILS" },
  THB: { name: "Thai Baht", symbol: "THB" },
  MYR: { name: "Malaysian Ringgit", symbol: "MYR" },
  IDR: { name: "Indonesian Rupiah", symbol: "IDR" }
};

export const CRYPTO_ASSETS: AssetDefinition[] = [
  { code: "BTC", name: "Bitcoin", type: "crypto", providerId: "bitcoin", symbol: "BTC", popular: true, decimals: 8 },
  { code: "ETH", name: "Ethereum", type: "crypto", providerId: "ethereum", popular: true, decimals: 8 },
  { code: "LTC", name: "Litecoin", type: "crypto", providerId: "litecoin", popular: true, decimals: 8 },
  { code: "XMR", name: "Monero", type: "crypto", providerId: "monero", popular: true, decimals: 8 },
  { code: "SOL", name: "Solana", type: "crypto", providerId: "solana", popular: true, decimals: 8 },
  { code: "USDT", name: "Tether", type: "crypto", providerId: "tether", popular: true, decimals: 8 },
  { code: "BNB", name: "BNB", type: "crypto", providerId: "binancecoin", decimals: 8 },
  { code: "XRP", name: "XRP", type: "crypto", providerId: "ripple", decimals: 8 },
  { code: "USDC", name: "USD Coin", type: "crypto", providerId: "usd-coin", decimals: 8 },
  { code: "ADA", name: "Cardano", type: "crypto", providerId: "cardano", decimals: 8 },
  { code: "DOGE", name: "Dogecoin", type: "crypto", providerId: "dogecoin", decimals: 8 },
  { code: "TRX", name: "TRON", type: "crypto", providerId: "tron", decimals: 8 },
  { code: "DOT", name: "Polkadot", type: "crypto", providerId: "polkadot", decimals: 8 },
  { code: "AVAX", name: "Avalanche", type: "crypto", providerId: "avalanche-2", decimals: 8 },
  { code: "LINK", name: "Chainlink", type: "crypto", providerId: "chainlink", decimals: 8 },
  { code: "TON", name: "Toncoin", type: "crypto", providerId: "the-open-network", decimals: 8 },
  { code: "NEAR", name: "NEAR Protocol", type: "crypto", providerId: "near", decimals: 8 },
  { code: "ATOM", name: "Cosmos", type: "crypto", providerId: "cosmos", decimals: 8 },
  { code: "BCH", name: "Bitcoin Cash", type: "crypto", providerId: "bitcoin-cash", decimals: 8 },
  { code: "ALGO", name: "Algorand", type: "crypto", providerId: "algorand", decimals: 8 },
  { code: "MATIC", name: "Polygon", type: "crypto", providerId: "matic-network", decimals: 8 },
  { code: "ETC", name: "Ethereum Classic", type: "crypto", providerId: "ethereum-classic", decimals: 8 }
];

export function buildFiatAssets(
  fiatCurrencies?: Record<string, string>
): AssetDefinition[] {
  const source = fiatCurrencies && Object.keys(fiatCurrencies).length > 0
    ? fiatCurrencies
    : Object.fromEntries(
        Object.entries(FALLBACK_FIAT_CURRENCIES).map(([code, value]) => [code, value.name])
      );

  return Object.entries(source)
    .map(([code, name]) => {
      const fallback = FALLBACK_FIAT_CURRENCIES[code];

      return {
        code,
        name: fallback?.name ?? name,
        type: "fiat" as const,
        symbol: fallback?.symbol,
        popular: POPULAR_CODE_SET.has(code)
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function buildAllAssets(fiatCurrencies?: Record<string, string>): AssetDefinition[] {
  return [...buildFiatAssets(fiatCurrencies), ...CRYPTO_ASSETS].sort((a, b) => {
    if (a.popular && !b.popular) {
      return -1;
    }

    if (!a.popular && b.popular) {
      return 1;
    }

    if (a.type !== b.type) {
      return a.type === "fiat" ? -1 : 1;
    }

    return a.code.localeCompare(b.code);
  });
}

export function isPopularCode(code: string): boolean {
  return POPULAR_CODE_SET.has(code);
}
