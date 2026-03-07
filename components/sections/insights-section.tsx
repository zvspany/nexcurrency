"use client";

import { ArrowRightLeft, Landmark, Layers, MoveRight, Workflow } from "lucide-react";

import { CurrencyIcon } from "@/components/converter/currency-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssetType } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface PopularPair {
  from: string;
  to: string;
  fromType: AssetType;
  toType: AssetType;
}

const popularPairs: PopularPair[] = [
  { from: "USD", to: "PLN", fromType: "fiat", toType: "fiat" },
  { from: "EUR", to: "GBP", fromType: "fiat", toType: "fiat" },
  { from: "USD", to: "BTC", fromType: "fiat", toType: "crypto" },
  { from: "BTC", to: "USD", fromType: "crypto", toType: "fiat" },
  { from: "ETH", to: "SOL", fromType: "crypto", toType: "crypto" },
  { from: "XMR", to: "BTC", fromType: "crypto", toType: "crypto" },
  { from: "LTC", to: "BTC", fromType: "crypto", toType: "crypto" },
  { from: "CHF", to: "JPY", fromType: "fiat", toType: "fiat" }
];

const howItWorks = [
  "Fiat rates are fetched from Frankfurter with USD as the common quote.",
  "Crypto prices are fetched from CoinGecko in USD.",
  "Any pair is converted through normalized USD-per-unit pricing."
];

const supportedAssets = [
  {
    title: "Fiat currencies",
    description:
      "Supports a broad list of global government-issued currencies, including major and regional pairs."
  },
  {
    title: "Cryptocurrencies",
    description:
      "Includes leading crypto assets such as BTC, ETH, LTC, XMR, SOL, USDT, and more."
  },
  {
    title: "Cross-market pairs",
    description:
      "Convert fiat-to-crypto, crypto-to-fiat, and crypto-to-crypto in one unified experience."
  }
];

interface InsightsSectionProps {
  selectedFromCode: string;
  selectedToCode: string;
  onSelectPopularPair: (fromCode: string, toCode: string) => void;
}

export function InsightsSection({
  selectedFromCode,
  selectedToCode,
  onSelectPopularPair
}: InsightsSectionProps) {
  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-3">
      <Card className="border-border/70 bg-card/85">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRightLeft className="h-4 w-4 text-sky-300" />
            Popular conversions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {popularPairs.map((pair) => {
            const isActive =
              pair.from === selectedFromCode && pair.to === selectedToCode;

            return (
              <Button
                key={`${pair.from}-${pair.to}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelectPopularPair(pair.from, pair.to)}
                className={cn(
                  "h-9 rounded-full border-border/70 bg-background/50 px-3.5 font-normal transition-all",
                  "hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100",
                  isActive &&
                    "border-cyan-400/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_hsl(189_100%_40%_/_0.2)]"
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                  <CurrencyIcon code={pair.from} type={pair.fromType} size="sm" />
                  <span>{pair.from}</span>
                  <MoveRight className="h-3.5 w-3.5 text-cyan-300" />
                  <CurrencyIcon code={pair.to} type={pair.toType} size="sm" />
                  <span>{pair.to}</span>
                </span>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Workflow className="h-4 w-4 text-cyan-300" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm text-muted-foreground">
          {howItWorks.map((line) => (
            <p key={line} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              {line}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/85">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-4 w-4 text-emerald-300" />
            Supported asset types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {supportedAssets.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <p className="flex items-center gap-2 font-medium text-foreground">
                <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                {item.title}
              </p>
              <p className="mt-1 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
