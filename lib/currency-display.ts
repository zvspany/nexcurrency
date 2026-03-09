import { AssetType } from "@/lib/assets";

interface DisplayAsset {
  code: string;
  type: AssetType;
  symbol?: string;
}

const FIAT_DISPLAY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  PLN: "zł",
  CHF: "CHF",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  CNY: "¥",
  INR: "₹",
  KRW: "₩",
  TRY: "₺",
  BRL: "R$",
  MXN: "MX$",
  THB: "฿"
};

export function getDisplaySymbol(asset?: DisplayAsset): string | undefined {
  if (!asset) {
    return undefined;
  }

  if (asset.type === "fiat") {
    return FIAT_DISPLAY_SYMBOLS[asset.code] ?? asset.symbol ?? asset.code;
  }

  return asset.symbol ?? asset.code;
}
