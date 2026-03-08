import { RateAsset } from "@/lib/rates";

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

    const formatted = value.toLocaleString("en-US", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    });

    return formatted;
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
