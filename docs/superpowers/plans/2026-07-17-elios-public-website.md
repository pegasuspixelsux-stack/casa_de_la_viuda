# Elios Public Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the guest-facing public website for Elios (Eskor Hotel): homepage, room/suite listing, room detail page with availability calendar, and a booking request form — all on static/mock data.

**Architecture:** Next.js 16 App Router, Server Components by default with a handful of Client Component "islands" for interactivity (mobile nav, gallery, calendar, booking form). A `src/services/` layer wraps static mock data behind `async` functions so it's the only code that changes when Firebase is introduced later. `/properties/[slug]` is statically generated via `generateStaticParams`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript (strict), Tailwind CSS v4. No new npm dependencies are introduced — everything needed (including `next/font/google`) ships with the already-installed `next` package.

**Spec:** `docs/superpowers/specs/2026-07-17-elios-public-website-design.md`

## Global Constraints

- Path alias `@/*` → `./src/*` (already configured in `tsconfig.json` — use it for all imports).
- **No automated test framework is introduced** (per spec §8). Every task's verification step uses `npx tsc --noEmit` (type safety) and `npm run build` (production build, including static generation) in place of unit tests. The final task adds a manual dev-server smoke pass with `curl`.
- Next.js 16 breaking changes to respect: `params` and `searchParams` in page components are `Promise`s and **must** be `await`ed — never accessed synchronously.
- Do **not** add `experimental.dynamicIO`, `experimental.useCache`, `experimental_ppr`, or `cacheComponents` to `next.config.ts` — per spec §2, Cache Components stays disabled for this phase.
- Server Components by default. `"use client"` is used only in exactly four files: `MobileMenuToggle`, `Calendar`, `Gallery`, `BookingForm`.
- Fonts: **Cormorant Garamond** (display/headings) + **Jost** (sans/body) via `next/font/google`, replacing the current Geist fonts.
- Exact palette (hex): ink `#1c2b3a`, sage `#6f9c97`, sage-dark `#56807b`, cream `#f4f1ec`, cream-line `#e6e2da`, muted `#8a8f94`, paper `#ffffff`. The homepage hero/about area renders on `paper` (white), not `cream` — explicit user direction, overriding the source mockup's cream background there.
- Mock prices are in EUR (the property's address, carried over from the source design, is in Germany).
- All imagery uses the `PhotoPlaceholder` component — there is no licensed photography in this phase.
- Homepage sections use numbered uppercase eyebrows (`01 —`, `02 —`, …) as a wayfinding signature for the single-scroll homepage, carried over from the source design's numbering motif. Interior pages (`/properties`, `/booking`) use the plain `SectionHeading` component with no numbering, since they aren't part of one sequential scroll.
- Commit after every task, staging only the files that task created or modified.

---

### Task 1: Domain types and pure utilities

**Files:**
- Create: `src/types/property.ts`
- Create: `src/types/reservation.ts`
- Create: `src/lib/delay.ts`
- Create: `src/lib/dates.ts`

**Interfaces:**
- Produces: `Property` type, `ReservationRequest` / `Reservation` types, `delay(ms: number): Promise<void>`, and from `dates.ts`: `toISODate`, `addDays`, `formatDateLong`, `formatPrice`, `CalendarDay` type, `buildMonthGrid(year, month, todayISO): CalendarDay[]`, `isDateUnavailable`, `rangeIncludesUnavailable`.
- Consumes: nothing (leaf files).

- [ ] **Step 1: Create `src/types/property.ts`**

```ts
export type Property = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  amenities: string[];
  maxGuests: number;
  sizeSqm: number;
  pricePerNight: number;
  bedConfiguration: string;
  unavailableDates: string[];
};
```

- [ ] **Step 2: Create `src/types/reservation.ts`**

```ts
export type ReservationRequest = {
  propertySlug: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  message?: string;
};

export type Reservation = ReservationRequest & {
  id: string;
  status: "pending";
  createdAt: string;
};
```

- [ ] **Step 3: Create `src/lib/delay.ts`**

```ts
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

- [ ] **Step 4: Create `src/lib/dates.ts`**

```ts
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function formatDateLong(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type CalendarDay = {
  dateISO: string;
  day: number;
  isCurrentMonth: boolean;
  isPast: boolean;
};

/** Builds a 6-row x 7-col grid (including leading/trailing days from
 * neighboring months) for the given year/month (0-indexed month). */
export function buildMonthGrid(
  year: number,
  month: number,
  todayISO: string
): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - startWeekday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + i);
    const dateISO = toISODate(current);
    days.push({
      dateISO,
      day: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === month,
      isPast: dateISO < todayISO,
    });
  }
  return days;
}

export function isDateUnavailable(
  dateISO: string,
  unavailableDates: string[]
): boolean {
  return unavailableDates.includes(dateISO);
}

export function rangeIncludesUnavailable(
  checkIn: string,
  checkOut: string,
  unavailableDates: string[]
): boolean {
  if (!checkIn || !checkOut) return false;
  let cursor = checkIn;
  while (cursor < checkOut) {
    if (unavailableDates.includes(cursor)) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}
```

- [ ] **Step 5: Verify types**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/types/property.ts src/types/reservation.ts src/lib/delay.ts src/lib/dates.ts
git commit -m "feat: add domain types and date/format utilities"
```

---

### Task 2: Mock data and services layer

**Files:**
- Create: `src/data/properties.ts`
- Create: `src/services/properties.ts`
- Create: `src/services/reservations.ts`

**Interfaces:**
- Consumes: `Property` (Task 1), `ReservationRequest`/`Reservation` (Task 1), `delay` (Task 1).
- Produces: `getProperties(): Promise<Property[]>`, `getPropertySlugs(): Promise<string[]>`, `getPropertyBySlug(slug: string): Promise<Property | undefined>`, `createReservationRequest(input: ReservationRequest): Promise<Reservation>`.

- [ ] **Step 1: Create `src/data/properties.ts`**

```ts
import type { Property } from "@/types/property";

export const properties: Property[] = [
  {
    slug: "deluxe-suite",
    name: "Deluxe Suite",
    category: "Suite",
    shortDescription:
      "A sea-facing suite with a private terrace and soaking tub.",
    description:
      "Our largest suite pairs a king bedroom with a separate sitting area and a private terrace overlooking the pool and coastline. Finished in warm oak and linen, the Deluxe Suite is built for slow mornings and long evenings by the water.",
    images: ["Sea-facing terrace", "King bedroom", "Marble soaking tub"],
    amenities: [
      "Private terrace",
      "Soaking tub",
      "Espresso machine",
      "Air conditioning",
      "King bed",
      "Sea view",
    ],
    maxGuests: 3,
    sizeSqm: 42,
    pricePerNight: 320,
    bedConfiguration: "1 King Bed",
    unavailableDates: [
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
      "2026-08-01",
      "2026-08-02",
    ],
  },
  {
    slug: "pool-view-room",
    name: "Pool View Room",
    category: "Room",
    shortDescription: "A bright double room overlooking the infinity pool.",
    description:
      "A calm, light-filled room with direct views over the infinity pool and cabanas. Ideal for couples who want to be steps from the water without giving up quiet.",
    images: ["Pool-view balcony", "Queen bedroom", "Walk-in shower"],
    amenities: [
      "Pool view",
      "Walk-in shower",
      "Air conditioning",
      "Queen bed",
      "Minibar",
    ],
    maxGuests: 2,
    sizeSqm: 28,
    pricePerNight: 210,
    bedConfiguration: "1 Queen Bed",
    unavailableDates: ["2026-07-20", "2026-07-21", "2026-08-05"],
  },
  {
    slug: "garden-apartment",
    name: "Garden Apartment",
    category: "Apartment",
    shortDescription: "A two-room apartment opening onto the hotel gardens.",
    description:
      "The Garden Apartment is a self-contained two-room layout with a small kitchenette, opening directly onto Eskor's landscaped gardens. Suited to longer stays or families who want extra space.",
    images: ["Garden terrace", "Living area", "Kitchenette"],
    amenities: [
      "Garden terrace",
      "Kitchenette",
      "Separate living area",
      "Air conditioning",
      "Two Twin Beds + Sofa Bed",
    ],
    maxGuests: 4,
    sizeSqm: 55,
    pricePerNight: 275,
    bedConfiguration: "2 Twin Beds + Sofa Bed",
    unavailableDates: ["2026-07-27", "2026-07-28", "2026-07-29"],
  },
  {
    slug: "junior-suite",
    name: "Junior Suite",
    category: "Suite",
    shortDescription: "A compact suite with a reading nook and courtyard view.",
    description:
      "A refined mid-size suite overlooking Eskor's inner courtyard, with a dedicated reading nook and a deep soaking tub. A quiet counterpoint to the pool-facing rooms.",
    images: ["Courtyard view", "Reading nook", "Soaking tub"],
    amenities: [
      "Courtyard view",
      "Reading nook",
      "Soaking tub",
      "Air conditioning",
      "Queen bed",
    ],
    maxGuests: 2,
    sizeSqm: 34,
    pricePerNight: 260,
    bedConfiguration: "1 Queen Bed",
    unavailableDates: ["2026-08-03", "2026-08-04"],
  },
  {
    slug: "ocean-terrace-room",
    name: "Ocean Terrace Room",
    category: "Room",
    shortDescription: "A ground-floor room with direct access to a sun terrace.",
    description:
      "Ground-floor and steps from the shoreline path, the Ocean Terrace Room has its own private sun terrace and outdoor shower — the closest room to the water at Eskor.",
    images: ["Private sun terrace", "Outdoor shower", "King bedroom"],
    amenities: [
      "Private terrace",
      "Outdoor shower",
      "Direct beach access",
      "Air conditioning",
      "King bed",
    ],
    maxGuests: 3,
    sizeSqm: 30,
    pricePerNight: 240,
    bedConfiguration: "1 King Bed",
    unavailableDates: ["2026-07-22", "2026-07-23", "2026-08-06", "2026-08-07"],
  },
];
```

- [ ] **Step 2: Create `src/services/properties.ts`**

```ts
import { delay } from "@/lib/delay";
import { properties } from "@/data/properties";
import type { Property } from "@/types/property";

const SIMULATED_LATENCY_MS = 150;

export async function getProperties(): Promise<Property[]> {
  await delay(SIMULATED_LATENCY_MS);
  return properties;
}

export async function getPropertySlugs(): Promise<string[]> {
  await delay(SIMULATED_LATENCY_MS);
  return properties.map((property) => property.slug);
}

export async function getPropertyBySlug(
  slug: string
): Promise<Property | undefined> {
  await delay(SIMULATED_LATENCY_MS);
  return properties.find((property) => property.slug === slug);
}
```

- [ ] **Step 3: Create `src/services/reservations.ts`**

This is a Server Action (`"use server"` file directive) so `BookingForm` (a Client
Component, built in Task 10) can call it directly. It's the seam that gets replaced
with a real Firebase write later — no caller-side changes when that happens.

```ts
"use server";

import { randomUUID } from "node:crypto";
import { delay } from "@/lib/delay";
import type { Reservation, ReservationRequest } from "@/types/reservation";

const SIMULATED_LATENCY_MS = 400;

export async function createReservationRequest(
  input: ReservationRequest
): Promise<Reservation> {
  await delay(SIMULATED_LATENCY_MS);
  return {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Verify types**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/data/properties.ts src/services/properties.ts src/services/reservations.ts
git commit -m "feat: add mock property data and services layer"
```

---

### Task 3: Design tokens, fonts, and root layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utilities `bg-paper`, `bg-cream`, `bg-cream-line`, `text-ink`,
  `text-muted`, `text-sage`, `bg-sage`, `bg-sage-dark`, `border-cream-line`,
  `font-display`, `font-sans` — used by every component task from here on.
- Consumes: nothing new.

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  --color-paper: #ffffff;
  --color-cream: #f4f1ec;
  --color-cream-line: #e6e2da;
  --color-ink: #1c2b3a;
  --color-muted: #8a8f94;
  --color-sage: #6f9c97;
  --color-sage-dark: #56807b;
}

@theme inline {
  --color-paper: var(--color-paper);
  --color-cream: var(--color-cream);
  --color-cream-line: var(--color-cream-line);
  --color-ink: var(--color-ink);
  --color-muted: var(--color-muted);
  --color-sage: var(--color-sage);
  --color-sage-dark: var(--color-sage-dark);
  --font-display: var(--font-cormorant);
  --font-sans: var(--font-jost);
}

body {
  background: var(--color-paper);
  color: var(--color-ink);
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Eskor Hotel",
  description:
    "A place to relax and enjoy the life. Book rooms, suites, and apartments at Eskor Hotel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes with "Compiled successfully" and no type errors. (The
homepage will still render the old `page.tsx` content at this point — that's
expected, it's rewritten in Task 6.)

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: set Eskor Hotel design tokens and fonts"
```

---

### Task 4: Shared UI primitives and layout shell (Navbar/Footer)

**Files:**
- Create: `src/components/ui/SectionHeading.tsx`
- Create: `src/components/ui/PhotoPlaceholder.tsx`
- Create: `src/components/ui/PriceTag.tsx`
- Create: `src/components/layout/MobileMenuToggle.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `formatPrice` (Task 1), Tailwind tokens (Task 3).
- Produces: `<SectionHeading eyebrow title align?>`, `<PhotoPlaceholder label className? variant?>`, `<PriceTag pricePerNight>`, `<Navbar>`, `<Footer>` — used by every page task from here on.

- [ ] **Step 1: Create `src/components/ui/SectionHeading.tsx`**

```tsx
type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/PhotoPlaceholder.tsx`**

```tsx
type PhotoPlaceholderProps = {
  label: string;
  className?: string;
  variant?: "light" | "dark";
};

export function PhotoPlaceholder({
  label,
  className = "",
  variant = "light",
}: PhotoPlaceholderProps) {
  const tone =
    variant === "dark"
      ? "from-ink/80 to-ink/40 text-paper/70"
      : "from-cream to-cream-line text-muted";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${tone} ${className}`}
    >
      <span className="px-4 text-center text-xs font-medium tracking-[0.2em] uppercase">
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/PriceTag.tsx`**

```tsx
import { formatPrice } from "@/lib/dates";

type PriceTagProps = {
  pricePerNight: number;
};

export function PriceTag({ pricePerNight }: PriceTagProps) {
  return (
    <p className="text-ink">
      <span className="font-display text-2xl font-medium">
        {formatPrice(pricePerNight)}
      </span>
      <span className="ml-1 text-xs tracking-[0.15em] text-muted uppercase">
        / night
      </span>
    </p>
  );
}
```

- [ ] **Step 4: Create `src/components/layout/MobileMenuToggle.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Rooms & Suites" },
  { href: "/booking", label: "Book" },
];

export function MobileMenuToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className="h-px w-5 bg-ink" />
        <span className="h-px w-5 bg-ink" />
        <span className="h-px w-5 bg-ink" />
      </button>
      {isOpen ? (
        <nav className="absolute inset-x-0 top-full border-t border-cream-line bg-paper">
          <ul className="flex flex-col divide-y divide-cream-line px-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-4 text-sm tracking-[0.15em] text-ink uppercase"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/layout/Navbar.tsx`**

```tsx
import Link from "next/link";
import { MobileMenuToggle } from "./MobileMenuToggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/properties", label: "Rooms & Suites" },
  { href: "/booking", label: "Book" },
];

export function Navbar() {
  return (
    <header className="relative z-20 border-b border-cream-line bg-paper">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="text-xl tracking-wide">
          <span className="font-semibold">ESKOR</span>
          <span className="font-light text-muted">HOTEL</span>
        </Link>
        <nav className="hidden gap-10 text-xs font-medium tracking-[0.2em] text-ink uppercase sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-sage">
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileMenuToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Create `src/components/layout/Footer.tsx`**

```tsx
const CONTACT_ITEMS = [
  "Eskor Hotel and Resort",
  "Box 16522 Eskor Street, Körle 6007, Germany",
  "+(041) 3454 7890",
  "info@eskor.de",
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink py-10 text-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-6 text-center text-xs tracking-[0.15em] uppercase sm:flex-row sm:justify-center sm:gap-6 sm:px-10">
        {CONTACT_ITEMS.map((item, index) => (
          <span key={item} className="flex items-center gap-6">
            {item}
            {index < CONTACT_ITEMS.length - 1 ? (
              <span className="hidden opacity-40 sm:inline">|</span>
            ) : null}
          </span>
        ))}
      </div>
    </footer>
  );
}
```

- [ ] **Step 7: Wire `Navbar`/`Footer` into `src/app/layout.tsx`**

Update the `body` in `src/app/layout.tsx` (from Task 3) to:

```tsx
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
```

```tsx
      <body className="flex min-h-full flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
```

- [ ] **Step 8: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/SectionHeading.tsx src/components/ui/PhotoPlaceholder.tsx src/components/ui/PriceTag.tsx src/components/layout/MobileMenuToggle.tsx src/components/layout/Navbar.tsx src/components/layout/Footer.tsx src/app/layout.tsx
git commit -m "feat: add shared UI primitives and site layout shell"
```

---

### Task 5: Properties listing (`/properties`)

**Files:**
- Create: `src/components/properties/PropertyCard.tsx`
- Create: `src/components/properties/PropertyGrid.tsx`
- Create: `src/app/properties/page.tsx`

**Interfaces:**
- Consumes: `Property` (Task 1), `getProperties` (Task 2), `PhotoPlaceholder`/`PriceTag`/`SectionHeading` (Task 4).
- Produces: `<PropertyCard property>`, `<PropertyGrid properties>` — reused on the homepage in Task 6.

- [ ] **Step 1: Create `src/components/properties/PropertyCard.tsx`**

```tsx
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      <PhotoPlaceholder
        label={property.images[0] ?? property.name}
        className="aspect-[4/3] w-full"
      />
      <div className="mt-4">
        <p className="text-xs tracking-[0.15em] text-sage uppercase">
          {property.category}
        </p>
        <h3 className="mt-1 font-display text-xl text-ink group-hover:text-sage">
          {property.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {property.maxGuests} guests · {property.sizeSqm} m² ·{" "}
          {property.bedConfiguration}
        </p>
        <div className="mt-3">
          <PriceTag pricePerNight={property.pricePerNight} />
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `src/components/properties/PropertyGrid.tsx`**

```tsx
import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property } from "@/types/property";

type PropertyGridProps = {
  properties: Property[];
};

export function PropertyGrid({ properties }: PropertyGridProps) {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.slug} property={property} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/properties/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getProperties } from "@/services/properties";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Rooms & Suites — Eskor Hotel",
  description: "Browse rooms, suites, and apartments at Eskor Hotel.",
};

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow="Stay With Us" title="Rooms & Suites" />
      <div className="mt-14">
        <PropertyGrid properties={properties} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully, `/properties` listed in the route output.

- [ ] **Step 5: Commit**

```bash
git add src/components/properties/PropertyCard.tsx src/components/properties/PropertyGrid.tsx src/app/properties/page.tsx
git commit -m "feat: add /properties listing page"
```

---

### Task 6: Homepage

**Files:**
- Create: `src/components/home/Hero.tsx`
- Create: `src/components/home/AboutSection.tsx`
- Create: `src/components/home/FeaturedProperties.tsx`
- Create: `src/components/home/BookingCta.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getProperties` (Task 2), `PhotoPlaceholder` (Task 4), `PropertyCard` (Task 5).
- Produces: fully composed `/` homepage.

- [ ] **Step 1: Create `src/components/home/Hero.tsx`**

```tsx
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

export function Hero() {
  return (
    <section className="relative aspect-[16/11] w-full sm:aspect-[16/9.2]">
      <PhotoPlaceholder
        label="Pool and hotel hero photograph"
        variant="dark"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/10 to-ink/40" />

      <div className="absolute inset-x-6 top-10 flex justify-end sm:inset-x-10">
        <Link
          href="/booking"
          className="bg-sage px-6 py-3 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
        >
          Book
        </Link>
      </div>

      <div className="absolute inset-x-6 bottom-14 text-paper sm:right-10 sm:left-auto sm:max-w-xl sm:text-right">
        <p className="mb-4 text-xs tracking-[0.3em] uppercase">
          01 — Welcome to Eskor Hotel
        </p>
        <h1 className="font-display text-4xl leading-[1.1] font-normal sm:text-6xl">
          Great Experiences at the Eskor Hotel
        </h1>
        <p className="mt-5 text-xs tracking-[0.3em] uppercase">
          A place to relax and enjoy the life
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/home/AboutSection.tsx`**

```tsx
const STATS = [
  { label: "Rooms & Suites", value: "48" },
  { label: "Years of Hospitality", value: "40" },
  { label: "Guest Rating", value: "4.9" },
];

export function AboutSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-10">
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-4 font-display text-[15vw] leading-none font-normal text-cream italic select-none sm:text-[7rem]"
      >
        Since 1986
      </p>

      <div className="relative">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          02 — About Eskor
        </p>

        <div className="mx-auto mt-14 grid max-w-6xl gap-12 text-left sm:grid-cols-[1fr_1.4fr_1.4fr]">
          <div>
            <div className="flex h-14 w-14 items-center justify-center border border-ink font-display text-2xl">
              H
            </div>
            <p className="mt-5 text-sm font-semibold tracking-[0.1em]">
              ESKOR HOTEL — RESORT
            </p>
            <p className="mt-2 text-xs text-muted">
              Luxury Hotel · Resort &nbsp; ★★★★★
            </p>
            <p className="mt-6 text-sm text-ink/70">
              Reservation hotline:{" "}
              <span className="text-sage">+05465 183888</span>
            </p>
            <p className="mt-1 text-sm text-ink/70">
              Reservation assistance available 24 hours
            </p>
          </div>

          <p className="text-sm leading-8 text-ink/70">
            Since 1986, Eskor Hotel has welcomed guests to a quiet stretch of
            coastline built around a single idea: a place to relax and enjoy
            the life. Every room and suite is designed for slow mornings and
            long evenings by the water.
          </p>

          <p className="text-sm leading-8 text-ink/70">
            From the poolside cabanas to the garden apartments, every stay
            comes with the same attention to detail our guests have returned
            for across four decades of hospitality.
          </p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-cream-line pt-10">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="font-display text-3xl text-ink">{stat.value}</dt>
              <dd className="mt-2 text-xs tracking-[0.15em] text-muted uppercase">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/home/FeaturedProperties.tsx`**

```tsx
import Link from "next/link";
import { getProperties } from "@/services/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";

export async function FeaturedProperties() {
  const properties = await getProperties();
  const featured = properties.slice(0, 3);

  return (
    <section className="bg-cream px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          03 — Rooms & Suites
        </p>
        <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
          Featured Stays
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/properties"
            className="border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
          >
            View All Rooms & Suites
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/components/home/BookingCta.tsx`**

```tsx
import Link from "next/link";

export function BookingCta() {
  return (
    <section className="bg-ink px-6 py-20 text-center text-paper sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        04 — Ready When You Are
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium sm:text-4xl">
        Request Your Stay at Eskor Hotel
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-paper/70">
        Tell us your dates and party size — our team confirms every request
        within 24 hours.
      </p>
      <Link
        href="/booking"
        className="mt-10 inline-block bg-sage px-10 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
      >
        Start Booking Request
      </Link>
    </section>
  );
}
```

- [ ] **Step 5: Replace `src/app/page.tsx`**

```tsx
import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { BookingCta } from "@/components/home/BookingCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <FeaturedProperties />
      <BookingCta />
    </>
  );
}
```

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/Hero.tsx src/components/home/AboutSection.tsx src/components/home/FeaturedProperties.tsx src/components/home/BookingCta.tsx src/app/page.tsx
git commit -m "feat: build Eskor Hotel homepage"
```

---

### Task 7: Calendar component (reusable, client)

**Files:**
- Create: `src/components/properties/Calendar.tsx`

**Interfaces:**
- Consumes: `buildMonthGrid`, `toISODate` (Task 1).
- Produces: `<Calendar unavailableDates selectedRange? onSelectDate?>` — used by `/properties/[slug]` (Task 9) and, later, the admin dashboard's `/admin/calendar`.

- [ ] **Step 1: Create `src/components/properties/Calendar.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { buildMonthGrid, toISODate } from "@/lib/dates";

type CalendarProps = {
  unavailableDates: string[];
  selectedRange?: { checkIn: string | null; checkOut: string | null };
  onSelectDate?: (dateISO: string) => void;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  unavailableDates,
  selectedRange,
  onSelectDate,
}: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayISO = toISODate(today);
  const days = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, todayISO),
    [viewYear, viewMonth, todayISO]
  );

  function goToPreviousMonth() {
    setViewMonth((month) => {
      if (month === 0) {
        setViewYear((year) => year - 1);
        return 11;
      }
      return month - 1;
    });
  }

  function goToNextMonth() {
    setViewMonth((month) => {
      if (month === 11) {
        setViewYear((year) => year + 1);
        return 0;
      }
      return month + 1;
    });
  }

  const monthLabel = new Date(
    Date.UTC(viewYear, viewMonth, 1)
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="border border-cream-line p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          className="text-sm text-muted hover:text-ink"
        >
          ‹
        </button>
        <p className="text-xs font-medium tracking-[0.2em] text-ink uppercase">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="text-sm text-muted hover:text-ink"
        >
          ›
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isUnavailable = unavailableDates.includes(day.dateISO);
          const isSelected =
            selectedRange?.checkIn === day.dateISO ||
            selectedRange?.checkOut === day.dateISO;
          const isDisabled = day.isPast || isUnavailable || !day.isCurrentMonth;

          return (
            <button
              key={day.dateISO}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate?.(day.dateISO)}
              className={[
                "aspect-square text-xs",
                !day.isCurrentMonth ? "text-muted/40" : "text-ink",
                isUnavailable ? "bg-cream-line line-through" : "",
                isSelected ? "bg-sage text-paper" : "",
                isDisabled ? "cursor-not-allowed" : "hover:bg-cream",
              ].join(" ")}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-cream-line" /> Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-sage" /> Selected
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0. (Not yet rendered anywhere — wired in Task 9.)

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/Calendar.tsx
git commit -m "feat: add reusable Calendar component"
```

---

### Task 8: Gallery component (client)

**Files:**
- Create: `src/components/properties/Gallery.tsx`

**Interfaces:**
- Consumes: `PhotoPlaceholder` (Task 4).
- Produces: `<Gallery images>` — used by `/properties/[slug]` (Task 9).

- [ ] **Step 1: Create `src/components/properties/Gallery.tsx`**

```tsx
"use client";

import { useState } from "react";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

type GalleryProps = {
  images: string[];
};

export function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <PhotoPlaceholder label="No photos yet" className="aspect-[16/10] w-full" />
    );
  }

  return (
    <div>
      <PhotoPlaceholder
        label={images[activeIndex]}
        variant="dark"
        className="aspect-[16/10] w-full"
      />
      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo: ${image}`}
              aria-current={index === activeIndex}
              className={`outline-offset-2 ${
                index === activeIndex ? "outline outline-sage" : ""
              }`}
            >
              <PhotoPlaceholder label={image} className="aspect-square w-full" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify types**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/Gallery.tsx
git commit -m "feat: add Gallery component"
```

---

### Task 9: Property detail page (`/properties/[slug]`)

**Files:**
- Create: `src/app/properties/[slug]/page.tsx`
- Create: `src/app/properties/[slug]/not-found.tsx`

**Interfaces:**
- Consumes: `getPropertyBySlug`, `getPropertySlugs` (Task 2), `Gallery` (Task 8), `Calendar` (Task 7), `PriceTag` (Task 4).
- Produces: statically generated detail pages for every property slug; `Request to Book` links to `/booking?property=<slug>` (consumed by Task 10).

- [ ] **Step 1: Create `src/app/properties/[slug]/not-found.tsx`**

```tsx
import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">
        We couldn&apos;t find that room
      </h1>
      <p className="mt-4 text-sm text-muted">
        The room or suite you&apos;re looking for may have been renamed or is
        no longer available.
      </p>
      <Link
        href="/properties"
        className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
      >
        View All Rooms & Suites
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/properties/[slug]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug, getPropertySlugs } from "@/services/properties";
import { Gallery } from "@/components/properties/Gallery";
import { Calendar } from "@/components/properties/Calendar";
import { PriceTag } from "@/components/ui/PriceTag";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPropertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Room not found — Eskor Hotel" };
  return {
    title: `${property.name} — Eskor Hotel`,
    description: property.shortDescription,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {property.category}
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">{property.name}</h1>
      <p className="mt-3 text-sm text-muted">
        {property.maxGuests} guests · {property.sizeSqm} m² ·{" "}
        {property.bedConfiguration}
      </p>

      <div className="mt-10">
        <Gallery images={property.images} />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl text-ink">About This Room</h2>
          <p className="mt-4 text-sm leading-8 text-ink/70">
            {property.description}
          </p>

          <h2 className="mt-10 font-display text-2xl text-ink">Amenities</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
            {property.amenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-2">
                <span className="h-1 w-1 bg-sage" />
                {amenity}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="border border-cream-line p-6">
            <PriceTag pricePerNight={property.pricePerNight} />
            <Link
              href={`/booking?property=${property.slug}`}
              className="mt-6 block bg-sage px-6 py-3 text-center text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
            >
              Request to Book
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl text-ink">
              Check Availability
            </h2>
            <div className="mt-4">
              <Calendar unavailableDates={property.unavailableDates} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully; output lists all 5 property slugs as
statically generated routes under `/properties/[slug]`.

- [ ] **Step 4: Commit**

```bash
git add src/app/properties/[slug]/page.tsx src/app/properties/[slug]/not-found.tsx
git commit -m "feat: add property detail page with gallery and availability calendar"
```

---

### Task 10: Booking form and `/booking` page

**Files:**
- Create: `src/components/booking/BookingForm.tsx`
- Create: `src/app/booking/page.tsx`

**Interfaces:**
- Consumes: `Property` (Task 1), `ReservationRequest` (Task 1), `createReservationRequest` (Task 2), `getProperties` (Task 2), `SectionHeading` (Task 4).
- Produces: working `/booking` page, reachable both directly and via `?property=<slug>`.

- [ ] **Step 1: Create `src/components/booking/BookingForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { createReservationRequest } from "@/services/reservations";
import type { Property } from "@/types/property";
import type { ReservationRequest } from "@/types/reservation";

type BookingFormProps = {
  properties: Property[];
  initialPropertySlug?: string;
};

type FormErrors = Partial<Record<keyof ReservationRequest, string>>;

export function BookingForm({ properties, initialPropertySlug }: BookingFormProps) {
  const initialSlug =
    properties.find((property) => property.slug === initialPropertySlug)
      ?.slug ??
    properties[0]?.slug ??
    "";

  const [form, setForm] = useState<ReservationRequest>({
    propertySlug: initialSlug,
    guestName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed">(
    "idle"
  );
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  const selectedProperty = properties.find(
    (property) => property.slug === form.propertySlug
  );

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!form.propertySlug) nextErrors.propertySlug = "Choose a room or suite.";
    if (!form.guestName.trim()) nextErrors.guestName = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      nextErrors.email = "Enter a valid email.";
    if (!form.phone.trim()) nextErrors.phone = "Enter a phone number.";
    if (!form.checkIn) nextErrors.checkIn = "Choose a check-in date.";
    if (!form.checkOut) nextErrors.checkOut = "Choose a check-out date.";
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      nextErrors.checkOut = "Check-out must be after check-in.";
    }
    if (form.guests < 1) {
      nextErrors.guests = "At least 1 guest is required.";
    } else if (selectedProperty && form.guests > selectedProperty.maxGuests) {
      nextErrors.guests = `This room sleeps up to ${selectedProperty.maxGuests} guests.`;
    }
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    const reservation = await createReservationRequest(form);
    setConfirmationId(reservation.id);
    setStatus("confirmed");
  }

  if (status === "confirmed") {
    return (
      <div className="border border-sage bg-cream px-8 py-12 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          Request Received
        </p>
        <h2 className="mt-4 font-display text-2xl text-ink">
          Thank you, {form.guestName.split(" ")[0]}.
        </h2>
        <p className="mt-3 text-sm text-ink/70">
          Confirmation reference{" "}
          <span className="font-medium text-ink">{confirmationId}</span>. Our
          team will confirm availability by email within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 sm:grid-cols-2">
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Room / Suite
        </span>
        <select
          value={form.propertySlug}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              propertySlug: event.target.value,
            }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        >
          {properties.map((property) => (
            <option key={property.slug} value={property.slug}>
              {property.name}
            </option>
          ))}
        </select>
        {errors.propertySlug ? (
          <span className="text-xs text-red-600">{errors.propertySlug}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Full Name
        </span>
        <input
          type="text"
          value={form.guestName}
          onChange={(event) =>
            setForm((current) => ({ ...current, guestName: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.guestName ? (
          <span className="text-xs text-red-600">{errors.guestName}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Email
        </span>
        <input
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.email ? (
          <span className="text-xs text-red-600">{errors.email}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Phone
        </span>
        <input
          type="tel"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.phone ? (
          <span className="text-xs text-red-600">{errors.phone}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Guests
        </span>
        <input
          type="number"
          min={1}
          value={form.guests}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              guests: Number(event.target.value),
            }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.guests ? (
          <span className="text-xs text-red-600">{errors.guests}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Check-in
        </span>
        <input
          type="date"
          value={form.checkIn}
          onChange={(event) =>
            setForm((current) => ({ ...current, checkIn: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.checkIn ? (
          <span className="text-xs text-red-600">{errors.checkIn}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Check-out
        </span>
        <input
          type="date"
          value={form.checkOut}
          onChange={(event) =>
            setForm((current) => ({ ...current, checkOut: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.checkOut ? (
          <span className="text-xs text-red-600">{errors.checkOut}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          Message (optional)
        </span>
        <textarea
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({ ...current, message: event.target.value }))
          }
          rows={4}
          className="border border-cream-line px-4 py-3 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-sage px-8 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark disabled:opacity-60 sm:col-span-2"
      >
        {status === "submitting" ? "Sending Request…" : "Send Booking Request"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create `src/app/booking/page.tsx`**

```tsx
import type { Metadata } from "next";
import { getProperties } from "@/services/properties";
import { BookingForm } from "@/components/booking/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Request a Booking — Eskor Hotel",
  description: "Request a reservation at Eskor Hotel.",
};

type BookingPageProps = {
  searchParams: Promise<{ property?: string }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { property } = await searchParams;
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow="Request a Stay" title="Book Your Room" />
      <div className="mt-12">
        <BookingForm properties={properties} initialPropertySlug={property} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully, `/booking` listed in the route output.

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/BookingForm.tsx src/app/booking/page.tsx
git commit -m "feat: add booking request form and /booking page"
```

---

### Task 11: Final integration verification

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Full type check and production build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully; route list includes `/`, `/properties`,
`/properties/[slug]` (5 static params), `/booking`.

- [ ] **Step 3: Manual dev-server smoke pass**

```bash
npm run dev &
echo $! > /tmp/elios-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s http://localhost:3000 | grep -o "Great Experiences at the Eskor Hotel"
curl -s http://localhost:3000/properties | grep -o "Rooms &amp; Suites"
curl -s http://localhost:3000/properties/deluxe-suite | grep -o "Deluxe Suite"
curl -s http://localhost:3000/properties/does-not-exist | grep -o "We couldn"
curl -s "http://localhost:3000/booking?property=deluxe-suite" | grep -o "Book Your Room"

kill "$(cat /tmp/elios-dev.pid)"
```

Expected: each `grep` prints a match, confirming the homepage hero copy, the
properties grid heading, a property detail page, the 404 fallback for an invalid
slug, and the booking page all render server-side with expected content.

- [ ] **Step 4: Browser walkthrough (if a browser tool is available in your environment)**

Drive the golden path: `/` → click "View All Rooms & Suites" → click a
`PropertyCard` → check the availability calendar shows blocked dates in the
current month → click "Request to Book" → confirm the room is pre-selected on
`/booking` → submit the form with valid data → confirm the "Request Received"
confirmation renders with a reference id.

If no browser automation tool is available, note that in your final report —
the `curl` checks in Step 3 remain the source of truth for this task.

- [ ] **Step 5: Final commit (only if any stragglers remain)**

```bash
git status
# If everything from Tasks 1-10 was already committed, there is nothing to do here.
# Otherwise, stage and commit any remaining changes with a descriptive message.
```
