"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Loader2, RefreshCcw } from "lucide-react";

import { CurrencyIcon } from "@/components/converter/currency-icon";
import { CurrencySelect } from "@/components/converter/currency-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMarketRates } from "@/hooks/use-market-rates";
import {
  formatAmount,
  formatInverseRate,
  formatRate,
  formatTimestamp
} from "@/lib/format";
import { buildRateMap, convertAmount } from "@/lib/rates";
import { validateAmount } from "@/lib/validation";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "EUR";

interface ConverterCardProps {
  forcedFromCode?: string;
  forcedToCode?: string;
  onPairChange?: (fromCode: string, toCode: string) => void;
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
  onRetry
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
            <p className="text-sm font-medium text-red-200">Unable to load market rates</p>
            <p className="mt-1 text-sm text-red-200/80">{message}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry} className="w-fit border-red-300/30">
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
  onPairChange
}: ConverterCardProps) {
  const { data, error, isLoading, refresh } = useMarketRates();

  const [amountInput, setAmountInput] = useState("1");
  const [fromCode, setFromCode] = useState(DEFAULT_FROM);
  const [toCode, setToCode] = useState(DEFAULT_TO);

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
        : assets.find((asset) => asset.code !== fromCode)?.code ?? assets[0].code;

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
      <CardHeader className="relative z-10 rounded-t-2xl bg-gradient-to-r from-sky-500/10 via-cyan-400/5 to-emerald-500/10 pb-4 sm:pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Smart Converter
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/70 bg-background/50">
              Fiat: {data.sources.fiat}
            </Badge>
            <Badge variant="outline" className="border-border/70 bg-background/50">
              Crypto: {data.sources.crypto}
            </Badge>
          </div>
        </div>
        <CardDescription className="pr-1 text-base/7 sm:text-sm">
          Convert fiat and crypto assets instantly using live normalized USD quote data.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 space-y-5 pt-4 sm:pt-5">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <span>Using last successful data. Latest refresh failed: {error}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="amount"
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            Amount
          </label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="Enter amount"
            className="h-14 rounded-xl bg-background/70 px-4 text-lg"
            aria-invalid={Boolean(amountError)}
            aria-describedby={amountError ? "amount-error" : undefined}
          />
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
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Converted value
          </p>
          {fromAsset && toAsset ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1">
                <CurrencyIcon code={fromAsset.code} type={fromAsset.type} size="sm" />
                {fromAsset.code}
              </span>
              <span>to</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1">
                <CurrencyIcon code={toAsset.code} type={toAsset.type} size="sm" />
                {toAsset.code}
              </span>
            </div>
          ) : null}
          <p className="mt-2 break-all text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {convertedDisplay}
          </p>
          {fromAsset ? (
            <p className="mt-2 text-sm text-muted-foreground">
              for {inputValidation.ok ? formatAmount(inputValidation.value, fromAsset) : "-"}{" "}
              {fromAsset.code}
            </p>
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
              {formatTimestamp(data.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
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
