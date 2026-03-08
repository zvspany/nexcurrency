# NexCurrency

Modern currency and crypto converter built with Next.js 14, TypeScript, Tailwind CSS, and shadcn-style UI components.

## Features

- Unified conversion for:
  - Fiat to fiat
  - Fiat to crypto
  - Crypto to fiat
  - Crypto to crypto
- Searchable asset selectors with popular presets
- Currency icons in selectors and conversion summary:
  - Crypto icons from `cryptocurrency-icons`
  - Fiat flags from `currency-flags`
- Default pair: `USD -> EUR`
- Instant conversion with swap action
- Current rate, inverse rate, and last update timestamp
- Client-side validation for invalid/negative amounts
- Loading, error, and empty states
- Dark, responsive fintech-style UI for mobile and desktop
- Normalized data layer for easy API provider swapping

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn-style UI components (local implementation)
- Zod (validation)

## Data Sources

- Fiat rates and currency list: [Frankfurter](https://www.frankfurter.app/)
- Crypto USD prices: [CoinGecko API](https://www.coingecko.com/en/api)

The app normalizes both feeds into a shared internal model (`usdPrice` per asset) and performs all conversions through USD when direct pairs are not available.

## Project Structure

```text
.
├── app
│   ├── api/rates/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── converter
│   │   ├── converter-card.tsx
│   │   └── currency-select.tsx
│   ├── sections
│   │   ├── hero.tsx
│   │   └── insights-section.tsx
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── command.tsx
│       ├── input.tsx
│       ├── popover.tsx
│       ├── separator.tsx
│       └── skeleton.tsx
├── hooks
│   ├── use-debounced-value.ts
│   └── use-market-rates.ts
├── lib
│   ├── api
│   │   ├── crypto.ts
│   │   ├── fiat.ts
│   │   └── normalize.ts
│   ├── assets.ts
│   ├── format.ts
│   ├── rates.ts
│   ├── utils.ts
│   └── validation.ts
├── .env.example
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Build and Lint

```bash
npm run lint
npm run build
npm run start
```

If you update `cryptocurrency-icons`, resync local PNG assets with:

```bash
npm run sync:crypto-icons
```

## Environment Variables

CoinGecko key is optional but recommended to reduce rate-limit issues.

Preferred server-side variables:

```env
COINGECKO_PRO_API_KEY=
# or
COINGECKO_DEMO_API_KEY=
```

Fallback generic option:

```env
COINGECKO_API_KEY=
COINGECKO_API_KEY_TYPE=demo  # demo | pro
```

Optional variable (only if you want to call API routes through a custom base URL):

```env
NEXT_PUBLIC_API_BASE_URL=
```

If empty, the app uses the local default (`/api/rates`).

## Architecture Notes

- `app/api/rates/route.ts` is the single internal market endpoint for the frontend.
- Provider modules are isolated in `lib/api/` so they can be swapped independently.
- `lib/api/normalize.ts` unifies fiat and crypto responses into one shape used by UI.
- Conversion formula is provider-agnostic:
  - `result = amount * (from.usdPrice / to.usdPrice)`
- UI stays fully client-side for interaction speed, while data aggregation stays server-side.

## Validation and Formatting

- Input validation is handled with Zod (`lib/validation.ts`)
- Fiat and crypto formatting rules are separated (`lib/format.ts`)
- Crypto values allow higher precision and support fractional amounts

## Notes

- The UI and all copy are fully English.
- Default experience is dark mode with a premium minimalist style.

## License

This project is licensed under the MIT License. See the `LICENSE` file for full text.
