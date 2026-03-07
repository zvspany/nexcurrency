"use client";

import { useCallback, useState } from "react";

import { ConverterCard } from "@/components/converter/converter-card";
import { Hero } from "@/components/sections/hero";
import { InsightsSection } from "@/components/sections/insights-section";

const DEFAULT_FROM = "USD";
const DEFAULT_TO = "EUR";

export default function HomePage() {
  const [selectedFromCode, setSelectedFromCode] = useState(DEFAULT_FROM);
  const [selectedToCode, setSelectedToCode] = useState(DEFAULT_TO);

  const handleSelectPopularPair = useCallback(
    (fromCode: string, toCode: string) => {
      setSelectedFromCode(fromCode);
      setSelectedToCode(toCode);
    },
    [],
  );

  const handlePairChange = useCallback((fromCode: string, toCode: string) => {
    setSelectedFromCode(fromCode);
    setSelectedToCode(toCode);
  }, []);

  return (
    <main className="relative isolate min-h-[100svh] overflow-hidden pb-20">
      <div className="container relative z-10">
        <Hero />
        <section className="mx-auto mt-10 max-w-5xl animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
          <ConverterCard
            forcedFromCode={selectedFromCode}
            forcedToCode={selectedToCode}
            onPairChange={handlePairChange}
          />
          <InsightsSection
            selectedFromCode={selectedFromCode}
            selectedToCode={selectedToCode}
            onSelectPopularPair={handleSelectPopularPair}
          />
        </section>
      </div>

      <footer className="container mt-12 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p>
          Market data is provided by Frankfurter and CoinGecko. Rates are
          refreshed automatically.
        </p>
        {/*
        <a
          href="https://github.com/zvspany/nextcurrency"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
        >
          Repository
        </a>
        */}
      </footer>
    </main>
  );
}
