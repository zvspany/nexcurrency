import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="outline"
          className="border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-200"
        >
          Real-time fiat and crypto conversion
        </Badge>
        <h1 className="mt-5 text-balance font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Convert Global Currencies and Crypto in One Premium Workspace
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
          Instantly switch between fiat and digital assets with live rates, smart
          formatting, and a clean professional interface built for speed.
        </p>
      </div>
    </section>
  );
}
