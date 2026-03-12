"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Check,
  Copy,
  Loader2,
  RefreshCcw,
} from "lucide-react";

import { CurrencyIcon } from "@/components/converter/currency-icon";
import { PriceSparkline } from "@/components/converter/price-sparkline";
import { CurrencySelect } from "@/components/converter/currency-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCryptoMarket } from "@/hooks/use-crypto-market";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getDisplaySymbol } from "@/lib/currency-display";
import {
  MARKET_CHART_RANGES,
  type MarketChartRange,
} from "@/lib/market";
import { useMarketRates } from "@/hooks/use-market-rates";
import {
  formatAmount,
  formatInverseRate,
  formatRate,
  formatSignedPercent,
  formatTimestamp,
  formatUsdCompact,
  formatUsdPrice,
} from "@/lib/format";
import { buildRateMap, convertAmount } from "@/lib/rates";
import { cn } from "@/lib/utils";
import { validateAmount } from "@/lib/validation";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "EUR";
const QUICK_AMOUNTS = [10, 50, 100, 500, 1000] as const;
const DEFAULT_MULTI_CONVERSION_CODES = ["USD", "EUR", "BTC", "ETH", "SOL"] as const;
const MAX_MULTI_CONVERSIONS = 4;
const MARKET_RANGE_LABELS: Record<MarketChartRange, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
  "1y": "1y",
  all: "all",
};

interface ConverterCardProps {
  forcedFromCode?: string;
  forcedToCode?: string;
  onPairChange?: (fromCode: string, toCode: string) => void;
  multiConversionCodes?: string[];
}

function ConverterSkeleton() {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" />
          <div>
            <p className="text-sm font-medium text-red-200">
              Unable to load market rates
            </p>
            <p className="mt-1 text-sm text-red-200/80">{message}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={onRetry}
          className="w-fit border-red-300/30"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-border/70">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">
          No assets are currently available. Please try again shortly.
        </p>
      </CardContent>
    </Card>
  );
}

export function ConverterCard({
  forcedFromCode,
  forcedToCode,
  onPairChange,
  multiConversionCodes,
}: ConverterCardProps) {
  const { data, error, isLoading, refresh } = useMarketRates();

  const [amountInput, setAmountInput] = useState("1");
  const [fromCode, setFromCode] = useState(DEFAULT_FROM);
  const [toCode, setToCode] = useState(DEFAULT_TO);
  const [isCopied, setIsCopied] = useState(false);
  const [marketRange, setMarketRange] = useState<MarketChartRange>("24h");

  const debouncedAmount = useDebouncedValue(amountInput, 120);

  const assets = useMemo(() => data?.assets ?? [], [data]);
  const rateMap = useMemo(() => buildRateMap(assets), [assets]);

  useEffect(() => {
    if (!assets.length) {
      return;
    }

    if (!rateMap.has(fromCode)) {
      setFromCode(rateMap.has(DEFAULT_FROM) ? DEFAULT_FROM : assets[0].code);
    }

    if (!rateMap.has(toCode)) {
      const fallback = rateMap.has(DEFAULT_TO)
        ? DEFAULT_TO
        : (assets.find((asset) => asset.code !== fromCode)?.code ??
          assets[0].code);

      setToCode(fallback);
    }
  }, [assets, fromCode, toCode, rateMap]);

  useEffect(() => {
    if (!assets.length) {
      return;
    }

    if (forcedFromCode && rateMap.has(forcedFromCode)) {
      setFromCode(forcedFromCode);
    }

    if (forcedToCode && rateMap.has(forcedToCode)) {
      setToCode(forcedToCode);
    }
  }, [assets, forcedFromCode, forcedToCode, rateMap]);

  useEffect(() => {
    onPairChange?.(fromCode, toCode);
  }, [fromCode, toCode, onPairChange]);

  const inputValidation = validateAmount(amountInput);
  const debouncedValidation = validateAmount(debouncedAmount);

  const fromAsset = rateMap.get(fromCode);
  const toAsset = rateMap.get(toCode);

  const convertedValue = useMemo(() => {
    if (!fromAsset || !toAsset || !debouncedValidation.ok) {
      return null;
    }

    return convertAmount(debouncedValidation.value, fromAsset, toAsset);
  }, [fromAsset, toAsset, debouncedValidation]);

  const resolvedMultiConversionCodes = useMemo(() => {
    const configuredCodes =
      multiConversionCodes && multiConversionCodes.length > 0
        ? multiConversionCodes
        : [...DEFAULT_MULTI_CONVERSION_CODES];

    return Array.from(
      new Set(
        [toCode, ...configuredCodes]
          .map((code) => code.trim().toUpperCase())
          .filter(Boolean),
      ),
    ).slice(0, MAX_MULTI_CONVERSIONS);
  }, [multiConversionCodes, toCode]);

  const multiConversions = useMemo(() => {
    if (!fromAsset || !debouncedValidation.ok) {
      return [];
    }

    return resolvedMultiConversionCodes
      .map((code) => rateMap.get(code))
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset))
      .map((asset) => ({
        asset,
        value: convertAmount(debouncedValidation.value, fromAsset, asset),
      }));
  }, [fromAsset, debouncedValidation, resolvedMultiConversionCodes, rateMap]);

  const currentRate = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return null;
    }

    return formatRate(fromAsset, toAsset);
  }, [fromAsset, toAsset]);

  const inverseRate = useMemo(() => {
    if (!fromAsset || !toAsset) {
      return null;
    }

    return formatInverseRate(fromAsset, toAsset);
  }, [fromAsset, toAsset]);

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const marketAsset = useMemo(() => {
    if (toAsset?.type === "crypto") {
      return toAsset;
    }

    if (fromAsset?.type === "crypto") {
      return fromAsset;
    }

    return null;
  }, [fromAsset, toAsset]);

  const {
    data: marketData,
    error: marketError,
    isLoading: isMarketLoading,
    refresh: refreshMarket,
  } = useCryptoMarket(marketAsset?.code ?? null, marketRange);

  const handleCopyConvertedValue = async () => {
    if (convertedValue === null || !toAsset) {
      return;
    }

    const text = `${formatAmount(convertedValue, toAsset)} ${toAsset.code}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1400);
    } catch {
      setIsCopied(false);
    }
  };

  const displayUpdatedAt = useMemo(() => {
    if (!data) {
      return null;
    }

    const timestamps = [new Date(data.updatedAt).getTime()];

    if (marketData?.updatedAt) {
      timestamps.push(new Date(marketData.updatedAt).getTime());
    }

    const latest = Math.max(
      ...timestamps.filter((timestamp) => Number.isFinite(timestamp)),
    );

    return Number.isFinite(latest) ? new Date(latest).toISOString() : data.updatedAt;
  }, [data, marketData?.updatedAt]);

  const marketRangeChangePct = useMemo(() => {
    if (!marketData) {
      return null;
    }

    const points = marketData.priceHistory;

    if (points.length >= 2) {
      const first = points[0]?.priceUsd;
      const last = points[points.length - 1]?.priceUsd;

      if (
        typeof first === "number" &&
        typeof last === "number" &&
        Number.isFinite(first) &&
        Number.isFinite(last) &&
        first > 0
      ) {
        return ((last - first) / first) * 100;
      }
    }

    if (marketRange === "24h") {
      return marketData.change24hPct;
    }

    return null;
  }, [marketData, marketRange]);

  const amountPrefix = getDisplaySymbol(fromAsset);
  const amountInputPaddingLeft = useMemo(() => {
    if (!amountPrefix) {
      return undefined;
    }

    const prefixWidthCh = Math.max(amountPrefix.length, 1);
    return `calc(1rem + ${prefixWidthCh}ch + 0.85rem)`;
  }, [amountPrefix]);

  if (isLoading && !data) {
    return <ConverterSkeleton />;
  }

  if (!data && error) {
    return <ErrorState message={error} onRetry={() => void refresh()} />;
  }

  if (!data || assets.length === 0) {
    return <EmptyState />;
  }

  const convertedDisplay =
    convertedValue !== null && toAsset
      ? `${formatAmount(convertedValue, toAsset)} ${toAsset.code}`
      : "--";

  const amountError = inputValidation.ok ? null : inputValidation.error;

  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/90">
      <CardHeader className="relative isolate z-10 overflow-hidden rounded-t-2xl border-b border-white/5 bg-[linear-gradient(115deg,rgba(16,39,62,0.9)_0%,rgba(14,32,50,0.95)_46%,rgba(14,50,54,0.88)_100%)] pb-4 sm:pb-5 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(140%_120%_at_0%_0%,rgba(56,189,248,0.12)_0%,rgba(56,189,248,0)_45%),radial-gradient(120%_100%_at_100%_0%,rgba(16,185,129,0.1)_0%,rgba(16,185,129,0)_45%)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Currency Converter
          </CardTitle>
          <Badge
            variant="outline"
            className="max-w-full border-border/70 bg-background/50 text-[11px] sm:text-xs"
          >
            <span className="inline-flex items-center gap-1 whitespace-nowrap sm:hidden">
              <span className="text-muted-foreground">Data sources:</span>
              <a
                href="https://frankfurter.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-foreground transition-colors hover:text-cyan-100"
              >
                {data.sources.fiat}
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="https://www.coingecko.com/"
                target="_blank"
                rel="noreferrer"
                className="text-foreground transition-colors hover:text-cyan-100"
              >
                {data.sources.crypto}
              </a>
            </span>

            <span className="hidden items-center gap-1 whitespace-nowrap sm:inline-flex">
              <span className="text-muted-foreground">Data sources:</span>
              <a
                href="https://frankfurter.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-foreground transition-colors hover:text-cyan-100"
              >
                {data.sources.fiat}
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="https://www.coingecko.com/"
                target="_blank"
                rel="noreferrer"
                className="text-foreground transition-colors hover:text-cyan-100"
              >
                {data.sources.crypto}
              </a>
            </span>
          </Badge>
        </div>
        <CardDescription className="pr-1 text-base/7 sm:text-sm">
          Convert fiat currencies and cryptocurrencies using live exchange
          rates.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-5 pt-4 sm:pt-5">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Using last successful data. Latest refresh failed: {error}
            </span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="amount"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Amount
          </label>
          <div className="relative">
            {amountPrefix ? (
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/80">
                {amountPrefix}
              </span>
            ) : null}
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="Enter amount"
              className="h-14 rounded-xl bg-background/70 px-4 text-lg"
              style={amountInputPaddingLeft ? { paddingLeft: amountInputPaddingLeft } : undefined}
              aria-invalid={Boolean(amountError)}
              aria-describedby={amountError ? "amount-error" : undefined}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {QUICK_AMOUNTS.map((quickAmount) => {
              const isActive =
                inputValidation.ok && inputValidation.value === quickAmount;

              return (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountInput(String(quickAmount))}
                  className={cn(
                    "h-7 rounded-full border-border/70 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground",
                    isActive ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100" : ""
                  )}
                  aria-label={`Set amount to ${quickAmount}`}
                >
                  {quickAmount}
                </Button>
              );
            })}
          </div>
          {amountError ? (
            <p id="amount-error" className="text-sm text-red-300">
              {amountError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <CurrencySelect
            label="From"
            value={fromCode}
            onChange={setFromCode}
            assets={assets}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="mx-auto mb-0.5 rounded-full border-border/70 bg-background/50"
            onClick={handleSwap}
            aria-label="Swap currencies"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <CurrencySelect
            label="To"
            value={toCode}
            onChange={setToCode}
            assets={assets}
          />
        </div>

        <div className="rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Converted value
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleCopyConvertedValue()}
              disabled={convertedValue === null || !toAsset}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={
                isCopied
                  ? "Converted value copied"
                  : "Copy converted value to clipboard"
              }
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-cyan-200" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {fromAsset && toAsset ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1">
                <CurrencyIcon
                  code={fromAsset.code}
                  type={fromAsset.type}
                  size="sm"
                />
                {fromAsset.code}
              </span>
              <span>to</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1">
                <CurrencyIcon
                  code={toAsset.code}
                  type={toAsset.type}
                  size="sm"
                />
                {toAsset.code}
              </span>
            </div>
          ) : null}
          <p className="mt-2 break-all text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {convertedDisplay}
          </p>
          {fromAsset ? (
            <p className="mt-2 text-sm text-muted-foreground">
              for{" "}
              {inputValidation.ok
                ? formatAmount(inputValidation.value, fromAsset)
                : "-"}{" "}
              {fromAsset.code}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/70 bg-background/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Multi conversion
            </p>
            {fromAsset && debouncedValidation.ok ? (
              <span className="text-xs text-muted-foreground">
                for {formatAmount(debouncedValidation.value, fromAsset)} {fromAsset.code}
              </span>
            ) : null}
          </div>

          {!debouncedValidation.ok ? (
            <p className="mt-3 text-sm text-red-300">{debouncedValidation.error}</p>
          ) : null}

          {debouncedValidation.ok && multiConversions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No additional assets available for multi conversion.
            </p>
          ) : null}

          {debouncedValidation.ok && multiConversions.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {multiConversions.map(({ asset, value }) => (
                <div
                  key={asset.code}
                  className="rounded-lg border border-border/60 bg-background/60 p-3"
                >
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CurrencyIcon code={asset.code} type={asset.type} size="sm" />
                    {asset.code}
                  </div>
                  <p className="mt-1 text-base font-medium text-foreground">
                    {formatAmount(value, asset)} {asset.code}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating multi conversion...
            </div>
          ) : null}
        </div>

        <Separator className="bg-border/70" />

        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em]">Current rate</p>
            <p className="mt-1 text-sm text-foreground">
              {fromAsset && toAsset && currentRate
                ? `1 ${fromAsset.code} = ${currentRate} ${toAsset.code}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em]">Inverse rate</p>
            <p className="mt-1 text-sm text-foreground">
              {fromAsset && toAsset && inverseRate
                ? `1 ${toAsset.code} = ${inverseRate} ${fromAsset.code}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em]">Last updated</p>
            <p className="mt-1 text-sm text-foreground">
              {formatTimestamp(displayUpdatedAt ?? data.updatedAt)}
            </p>
          </div>
        </div>

        {marketAsset ? (
          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Market data
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-xs text-foreground">
                <CurrencyIcon
                  code={marketAsset.code}
                  type={marketAsset.type}
                  size="sm"
                />
                {marketAsset.code}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {MARKET_CHART_RANGES.map((range) => {
                const isActive = marketRange === range;

                return (
                  <Button
                    key={range}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMarketRange(range)}
                    className={cn(
                      "h-7 rounded-full border-border/70 px-3 text-xs text-muted-foreground hover:text-foreground",
                      isActive ? "border-cyan-300/50 bg-cyan-500/15 text-cyan-100" : "",
                    )}
                    aria-pressed={isActive}
                    aria-label={`Show ${MARKET_RANGE_LABELS[range]} chart`}
                  >
                    {MARKET_RANGE_LABELS[range]}
                  </Button>
                );
              })}
            </div>

            {marketError && !marketData ? (
              <p className="mt-3 text-xs text-red-300/90">
                Unable to load market data right now.
              </p>
            ) : null}

            <PriceSparkline
              points={marketData?.priceHistory ?? []}
              rangeLabel={MARKET_RANGE_LABELS[marketRange]}
              isLoading={isMarketLoading && !marketData}
              className="mt-3"
            />

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  Price
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {marketData ? formatUsdPrice(marketData.priceUsd) : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  {MARKET_RANGE_LABELS[marketRange]}
                </p>
                <p
                  className={cn(
                    "mt-1 text-base font-medium text-foreground",
                    marketRangeChangePct !== null
                      ? marketRangeChangePct > 0
                        ? "text-emerald-300"
                        : marketRangeChangePct < 0
                          ? "text-red-300"
                          : "text-foreground"
                      : "text-foreground",
                  )}
                >
                  {marketData ? formatSignedPercent(marketRangeChangePct) : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  Market cap
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {marketData ? formatUsdCompact(marketData.marketCapUsd) : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                  Volume (24h)
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {marketData ? formatUsdCompact(marketData.volume24hUsd) : "-"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex min-h-4 items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {marketData
                  ? `Updated ${formatTimestamp(marketData.updatedAt)}`
                  : isMarketLoading
                    ? "Updating market data..."
                    : ""}
              </span>
              {marketData ? <span>Source: {marketData.source}</span> : null}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              void refresh();
              void refreshMarket();
            }}
            className="text-muted-foreground"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh rates
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating market rates...
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
