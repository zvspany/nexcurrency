import { Github } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="text-foreground">Open Source</span>
            <span className="text-muted-foreground/70">•</span>
            <span className="text-foreground">MIT License</span>
            <span className="text-muted-foreground/70">•</span>
            <a
              href="https://github.com/zvspany/nexcurrency"
              target="_blank"
              rel="noreferrer"
              aria-label="View on GitHub"
              title="View on GitHub"
              className="inline-flex items-center text-cyan-200 transition-colors hover:text-cyan-100"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
        <h1 className="mt-5 text-balance font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Open-source fiat and crypto converter
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Convert fiat currencies and cryptocurrencies using live exchange
          rates.
        </p>
      </div>
    </section>
  );
}
