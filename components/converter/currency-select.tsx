"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { POPULAR_CODES } from "@/lib/assets";
import { RateAsset } from "@/lib/rates";
import { cn } from "@/lib/utils";
import { CurrencyIcon } from "@/components/converter/currency-icon";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CurrencySelectProps {
  value: string;
  onChange: (nextCode: string) => void;
  assets: RateAsset[];
  label: string;
  disabled?: boolean;
}

function AssetLabel({ asset }: { asset?: RateAsset }) {
  if (!asset) {
    return (
      <span className="text-sm text-muted-foreground">Choose currency</span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2.5 text-left">
      <CurrencyIcon code={asset.code} type={asset.type} size="md" className="shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {asset.code} - {asset.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {asset.type === "fiat" ? "Fiat" : "Crypto"}
          {asset.symbol ? ` | ${asset.symbol}` : ""}
        </span>
      </span>
    </span>
  );
}

export function CurrencySelect({
  value,
  onChange,
  assets,
  label,
  disabled
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.code === value),
    [assets, value]
  );

  const popularAssets = useMemo(
    () =>
      POPULAR_CODES.map((code) => assets.find((asset) => asset.code === code)).filter(
        (asset): asset is RateAsset => Boolean(asset)
      ),
    [assets]
  );

  const allAssets = useMemo(() => {
    const popularSet = new Set(popularAssets.map((asset) => asset.code));

    return assets
      .filter((asset) => !popularSet.has(asset.code))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "fiat" ? -1 : 1;
        }

        return a.code.localeCompare(b.code);
      });
  }, [assets, popularAssets]);

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-auto w-full justify-between rounded-xl border-border/70 px-3 py-2.5"
          >
            <AssetLabel asset={selectedAsset} />
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by code or name..." />
            <CommandList>
              <CommandEmpty>No assets found.</CommandEmpty>
              {popularAssets.length > 0 ? (
                <CommandGroup heading="Popular">
                  {popularAssets.map((asset) => (
                    <CommandItem
                      key={asset.code}
                      value={`${asset.code} ${asset.name} ${asset.type}`}
                      onSelect={() => {
                        onChange(asset.code);
                        setOpen(false);
                      }}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <CurrencyIcon
                          code={asset.code}
                          type={asset.type}
                          size="md"
                          className="shrink-0"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">
                            {asset.code} - {asset.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {asset.type === "fiat" ? "Fiat" : "Crypto"}
                            {asset.symbol ? ` | ${asset.symbol}` : ""}
                          </span>
                        </span>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === asset.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {allAssets.length > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading="All assets">
                {allAssets.map((asset) => (
                  <CommandItem
                    key={asset.code}
                    value={`${asset.code} ${asset.name} ${asset.type}`}
                    onSelect={() => {
                      onChange(asset.code);
                      setOpen(false);
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <CurrencyIcon
                        code={asset.code}
                        type={asset.type}
                        size="md"
                        className="shrink-0"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {asset.code} - {asset.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {asset.type === "fiat" ? "Fiat" : "Crypto"}
                          {asset.symbol ? ` | ${asset.symbol}` : ""}
                        </span>
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4",
                        value === asset.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
