"use client";

import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import { formatUsdPrice } from "@/lib/format";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientBaseId = useId().replace(/:/g, "-");

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
    const gradientId = `sparkline-gradient-${gradientBaseId}`;

    return {
      width,
      height,
      padding,
      linePath,
      areaPath,
      isUptrend,
      gradientId,
      points: sorted.map((point, index) => ({
        timestamp: point.timestamp,
        priceUsd: point.priceUsd,
        x: coordinates[index]?.x ?? 0,
        y: coordinates[index]?.y ?? 0,
      })),
    };
  }, [points, gradientBaseId]);

  const hoveredPoint = useMemo(() => {
    if (!chart || hoveredIndex === null) {
      return null;
    }

    const clampedIndex = Math.max(
      0,
      Math.min(hoveredIndex, chart.points.length - 1),
    );

    return chart.points[clampedIndex] ?? null;
  }, [chart, hoveredIndex]);

  const hoveredPointPosition = useMemo(() => {
    if (!chart || !hoveredPoint) {
      return null;
    }

    return {
      leftPercent: (hoveredPoint.x / chart.width) * 100,
      topPercent: (hoveredPoint.y / chart.height) * 100,
    };
  }, [chart, hoveredPoint]);

  const tooltipPlacement = useMemo(() => {
    if (!hoveredPointPosition) {
      return null;
    }

    const { leftPercent, topPercent } = hoveredPointPosition;

    if (leftPercent >= 76) {
      return {
        transform: "translate(calc(-100% - 10px), -50%)",
      };
    }

    if (leftPercent <= 24) {
      return {
        transform: "translate(10px, -50%)",
      };
    }

    if (topPercent <= 30) {
      return {
        transform: "translate(-50%, 10px)",
      };
    }

    return {
      transform: "translate(-50%, calc(-100% - 10px))",
    };
  }, [hoveredPointPosition]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!chart) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) {
      return;
    }

    const relativeX = (event.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(relativeX, 1));
    const nextIndex = Math.round(clamped * (chart.points.length - 1));

    setHoveredIndex(nextIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

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
        <div
          className="relative mt-2"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
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
                id={chart.gradientId}
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

            <path d={chart.areaPath} fill={`url(#${chart.gradientId})`} />
            <path
              d={chart.linePath}
              fill="none"
              stroke={chart.isUptrend ? "#34d399" : "#fb7185"}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="bevel"
            />
            {hoveredPoint ? (
              <>
                <line
                  x1={hoveredPoint.x}
                  y1={chart.padding}
                  x2={hoveredPoint.x}
                  y2={chart.height - chart.padding}
                  stroke={chart.isUptrend ? "#34d399" : "#fb7185"}
                  strokeOpacity="0.35"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            ) : null}
          </svg>

          {hoveredPoint && hoveredPointPosition ? (
            <>
              <span
                className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border border-background shadow-[0_0_0_3px_rgba(0,0,0,0.16)]"
                style={{
                  left: `${hoveredPointPosition.leftPercent}%`,
                  top: `${hoveredPointPosition.topPercent}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: chart.isUptrend ? "#34d399" : "#fb7185",
                }}
              />
              <span
                className="pointer-events-none absolute h-5 w-5 rounded-full border"
                style={{
                  left: `${hoveredPointPosition.leftPercent}%`,
                  top: `${hoveredPointPosition.topPercent}%`,
                  transform: "translate(-50%, -50%)",
                  borderColor: chart.isUptrend
                    ? "rgba(52, 211, 153, 0.35)"
                    : "rgba(251, 113, 133, 0.35)",
                }}
              />
            </>
          ) : null}

          {hoveredPoint && hoveredPointPosition && tooltipPlacement ? (
            <div
              className="pointer-events-none absolute top-1 z-10 rounded-md border border-border/70 bg-background/95 px-2 py-1 text-[11px] text-foreground shadow-sm backdrop-blur"
              style={
                {
                  left: `${hoveredPointPosition.leftPercent}%`,
                  top: `${hoveredPointPosition.topPercent}%`,
                  transform: tooltipPlacement.transform,
                } as CSSProperties
              }
            >
              <p className="font-medium">{formatUsdPrice(hoveredPoint.priceUsd)}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(hoveredPoint.timestamp))}
              </p>
            </div>
          ) : null}
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
