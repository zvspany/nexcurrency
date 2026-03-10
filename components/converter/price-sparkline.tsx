"use client";

import { useId, useMemo } from "react";

import { cn } from "@/lib/utils";

interface PriceSparklinePoint {
  timestamp: string;
  priceUsd: number;
}

interface PriceSparklineProps {
  points: PriceSparklinePoint[];
  rangeLabel: string;
  isLoading?: boolean;
  className?: string;
}

export function PriceSparkline({
  points,
  rangeLabel,
  isLoading = false,
  className,
}: PriceSparklineProps) {
  const gradientId = useId();

  const chart = useMemo(() => {
    const sorted = [...points]
      .filter((point) => Number.isFinite(point.priceUsd) && point.priceUsd > 0)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    if (sorted.length < 2) {
      return null;
    }

    const width = 320;
    const height = 84;
    const padding = 6;

    const prices = sorted.map((point) => point.priceUsd);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = Math.max(maxPrice - minPrice, maxPrice * 0.001, 0.00000001);

    const coordinates = sorted.map((point, index) => {
      const x =
        padding + (index / (sorted.length - 1)) * (width - padding * 2);
      const y =
        padding +
        (1 - (point.priceUsd - minPrice) / range) * (height - padding * 2);

      return { x, y };
    });

    const linePath = coordinates
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      )
      .join(" ");

    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
    const isUptrend = prices[prices.length - 1] >= prices[0];

    return {
      width,
      height,
      linePath,
      areaPath,
      isUptrend,
    };
  }, [points]);

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-background/60 p-3",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        Price ({rangeLabel})
      </p>

      {chart ? (
        <div className="mt-2">
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="h-20 w-full"
            role="img"
            aria-label={`Price trend over the last ${rangeLabel}`}
            preserveAspectRatio="none"
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={chart.isUptrend ? "#34d399" : "#fb7185"}
                  stopOpacity="0.26"
                />
                <stop
                  offset="100%"
                  stopColor={chart.isUptrend ? "#34d399" : "#fb7185"}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <path d={chart.areaPath} fill={`url(#${gradientId})`} />
            <path
              d={chart.linePath}
              fill="none"
              stroke={chart.isUptrend ? "#34d399" : "#fb7185"}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="bevel"
            />
          </svg>
        </div>
      ) : (
        <div className="mt-2 flex h-20 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
          {isLoading
            ? `Loading ${rangeLabel} price history...`
            : `${rangeLabel} price history unavailable`}
        </div>
      )}
    </div>
  );
}
