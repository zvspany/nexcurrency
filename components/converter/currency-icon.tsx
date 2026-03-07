"use client";

import { useMemo, useState } from "react";

import type { AssetType } from "@/lib/assets";
import { FIAT_FLAG_CODES } from "@/lib/fiat-flag-codes";
import { cn } from "@/lib/utils";

const sizeClassMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8"
} as const;

type IconSize = keyof typeof sizeClassMap;

interface CurrencyIconProps {
  code: string;
  type: AssetType;
  size?: IconSize;
  className?: string;
}

export function CurrencyIcon({
  code,
  type,
  size = "md",
  className
}: CurrencyIconProps) {
  const [cryptoMissing, setCryptoMissing] = useState(false);

  const lowerCode = useMemo(() => code.toLowerCase(), [code]);
  const wrapperSize = sizeClassMap[size];

  if (type === "fiat" && FIAT_FLAG_CODES.has(lowerCode)) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          wrapperSize,
          className
        )}
        aria-hidden
      >
        <span
          className={`currency-flag currency-flag-${lowerCode}`}
          style={{
            width: "100%",
            height: "100%",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      </span>
    );
  }

  if (type === "crypto" && !cryptoMissing) {
    return (
      <img
        src={`/icons/crypto/${lowerCode}.png`}
        alt=""
        aria-hidden
        className={cn("rounded-full object-cover", wrapperSize, className)}
        onError={() => setCryptoMissing(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border/70 bg-muted text-[10px] font-semibold uppercase text-muted-foreground",
        wrapperSize,
        className
      )}
      aria-hidden
    >
      {code.slice(0, 2)}
    </span>
  );
}
