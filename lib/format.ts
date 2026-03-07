import { RateAsset } from "@/lib/rates";

function trimTrailingZeroes(value: string): string {
  return value.replace(/\.?0+$/, "");
}

export function formatAmount(value: number, asset: RateAsset): string {
  if (!Number.isFinite(value)) {
    return "-";
  }

  if (asset.type === "crypto") {
    if (value === 0) {
      return "0";
    }

    if (Math.abs(value) < 0.00000001) {
      return "<0.00000001";
    }

    const precision = asset.decimals ?? 8;
    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: precision
    });

    return trimTrailingZeroes(formatted);
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 4
  });
}

export function formatRate(from: RateAsset, to: RateAsset): string {
  const rate = from.usdPrice / to.usdPrice;
  return formatAmount(rate, to);
}

export function formatInverseRate(from: RateAsset, to: RateAsset): string {
  const inverse = to.usdPrice / from.usdPrice;
  return formatAmount(inverse, from);
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
