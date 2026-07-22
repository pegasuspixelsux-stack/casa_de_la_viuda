# Single-Property Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Elios ("Casa de la Viuda") from a 5-room/suite independently-bookable hotel model into a single whole-home vacation rental, without changing any layout, styling, or navigation structure.

**Architecture:** Introduce one new `HomeListing` data entity (the single bookable whole-property) alongside the existing `Property` array, which gets repurposed into 5 purely descriptive "spaces" (no price/availability/guest-cap of their own). The booking form and calendar move from being keyed on a user-selected room to being keyed on the single `home` object. All existing routes, files, and components are reused as-is; only their content and a few render branches change.

**Tech Stack:** Next.js 16 (App Router), TypeScript, next-intl (typed messages via `src/global.d.ts`), Tailwind CSS. No test runner is configured in this repo (`package.json` has no `test` script, no Jest/Vitest) — verification per task is `npx tsc --noEmit`, `npm run lint`, and (final task) `npm run build` + a manual dev-server walkthrough, matching the Testing section of the approved spec.

## Global Constraints

- No changes to layout, styling, spacing, typography, colors, animations, navigation structure, component structure, or responsive behavior anywhere in this plan.
- No new routes, no renamed/moved files, no new admin/API surface (none currently exists — out of scope).
- Reuse existing components (`Calendar`, `PriceTag`, `Gallery`, `PhotoPlaceholder`, `SectionHeading`) unmodified; only wire them to new data.
- Keep exactly the 5 existing `properties/[slug]` routes/slugs — repurpose their content, do not add or remove routes.
- `nav.properties` (and equivalent "Rooms & Suites" copy) becomes "The Home" (EN) / "La Casa" (ES), per user decision.
- Whole-home numbers are computed placeholders (per approved spec): `pricePerNight = 890`, `maxGuests = 14` (sum of the 5 rooms' old capacities), `unavailableDates` = union of the 5 rooms' old blocked dates.
- Full spec: `docs/superpowers/specs/2026-07-22-single-property-conversion-design.md`.

---

### Task 1: Whole-home data entity (type, data, service)

**Files:**
- Modify: `src/types/property.ts`
- Create: `src/data/home.ts`
- Create: `src/services/home.ts`

**Interfaces:**
- Consumes: nothing (purely additive; existing `Property` type in the same file is untouched in this task).
- Produces: `HomeListing` type (`src/types/property.ts`), `home: HomeListing` constant (`src/data/home.ts`), `getHome(): Promise<HomeListing>` (`src/services/home.ts`) — all three consumed by Task 4.

- [ ] **Step 1: Add the `HomeListing` type**

Append to `src/types/property.ts` (the existing `Property` type stays exactly as-is in this step):

```ts
export type HomeListing = {
  slug: string;
  name: string;
  description: string;
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  unavailableDates: string[];
};
```

- [ ] **Step 2: Create the whole-home data file**

Create `src/data/home.ts`:

```ts
import type { HomeListing } from "@/types/property";

export const home: HomeListing = {
  slug: "casa-de-la-viuda",
  name: "Casa de la Viuda",
  description:
    "Casa de la Viuda is a full vacation home on a quiet stretch of coastline, reserved exclusively for one group of guests at a time. Two bedrooms, a shared living area with a full kitchen, a reading den, and a garden terrace are all included in every stay — nothing in the home is rented separately.",
  amenities: [
    "Wi-Fi",
    "Full kitchen",
    "Private parking",
    "Air conditioning",
    "Garden",
    "Pool",
    "BBQ",
    "Laundry",
    "Workspace",
    "Smart TV",
  ],
  pricePerNight: 890,
  maxGuests: 14,
  unavailableDates: [
    "2026-07-20",
    "2026-07-21",
    "2026-07-22",
    "2026-07-23",
    "2026-07-24",
    "2026-07-25",
    "2026-07-26",
    "2026-07-27",
    "2026-07-28",
    "2026-07-29",
    "2026-08-01",
    "2026-08-02",
    "2026-08-03",
    "2026-08-04",
    "2026-08-05",
    "2026-08-06",
    "2026-08-07",
  ],
};
```

- [ ] **Step 3: Create the home service (same mock pattern as `services/properties.ts`)**

Create `src/services/home.ts`:

```ts
import { delay } from "@/lib/delay";
import { home } from "@/data/home";
import type { HomeListing } from "@/types/property";

const SIMULATED_LATENCY_MS = 150;

// This file is the seam that gets replaced with real Firebase calls; callers don't change.
export async function getHome(): Promise<HomeListing> {
  await delay(SIMULATED_LATENCY_MS);
  return home;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive change, nothing consumes the new files yet).

- [ ] **Step 5: Commit**

```bash
git add src/types/property.ts src/data/home.ts src/services/home.ts
git commit -m "feat: add whole-home data entity for single-property booking"
```

---

### Task 2: Strip per-room price/capacity from `PropertyCard`

**Files:**
- Modify: `src/components/properties/PropertyCard.tsx`

**Interfaces:**
- Consumes: existing `Property` type (unchanged in this task — `maxGuests`/`pricePerNight` still exist on the type/data, this task just stops reading them).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Rewrite `PropertyCard.tsx` to drop guest count and price**

Replace the full contents of `src/components/properties/PropertyCard.tsx`:

```tsx
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      {property.cardImage ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={property.cardImage}
            alt={property.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <PhotoPlaceholder
          label={property.images[0] ?? property.name}
          className="aspect-[4/3] w-full"
        />
      )}
      <div className="mt-4">
        <p className="text-xs tracking-[0.15em] text-sage uppercase">
          {property.category}
        </p>
        <h3 className="mt-1 font-display text-xl text-ink group-hover:text-sage">
          {property.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {property.sizeSqm} m²
          {property.bedConfiguration ? ` · ${property.bedConfiguration}` : ""}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (no more unused `useTranslations`/`PriceTag` imports — both removed above).

- [ ] **Step 3: Commit**

```bash
git add src/components/properties/PropertyCard.tsx
git commit -m "refactor: drop per-room price/guest-count from PropertyCard"
```

---

### Task 3: Repurpose the space detail page and its not-found copy

**Files:**
- Modify: `src/app/[locale]/properties/[slug]/page.tsx`
- Modify: `src/app/[locale]/properties/[slug]/not-found.tsx`
- Modify: `src/app/[locale]/properties/[slug]/NotFoundLink.tsx`
- Modify: `messages/en.json`
- Modify: `messages/es.json`

**Interfaces:**
- Consumes: existing `getPropertyBySlug`/`getPropertySlugs` from `src/services/properties.ts` (unchanged signatures).
- Produces: nothing consumed by later tasks (this page no longer needs `pricePerNight`/`unavailableDates`/`maxGuests`, freeing Task 5 to remove those fields from the `Property` type without touching this file again).

- [ ] **Step 1: Rewrite `properties/[slug]/page.tsx` — drop the booking sidebar**

Replace the full contents of `src/app/[locale]/properties/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPropertyBySlug, getPropertySlugs } from "@/services/properties";
import { Gallery } from "@/components/properties/Gallery";

type PropertyPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPropertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "properties.detail",
  });
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: t("notFoundMetadataTitle") };
  return {
    title: `${property.name} — Casa de la Viuda`,
    description: property.shortDescription,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("properties.detail");
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
        {property.sizeSqm} m²
        {property.bedConfiguration ? ` · ${property.bedConfiguration}` : ""}
      </p>

      <div className="mt-10">
        <Gallery images={property.images} />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl text-ink">{t("aboutTitle")}</h2>
          <p className="mt-4 text-sm leading-8 text-ink/70">
            {property.description}
          </p>

          <h2 className="mt-10 font-display text-2xl text-ink">
            {t("amenitiesTitle")}
          </h2>
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
            <p className="text-sm leading-7 text-ink/70">
              {t("partOfHomeBody")}
            </p>
            <Link
              href="/booking"
              className="mt-6 block bg-sage px-6 py-3 text-center text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
            >
              {t("partOfHomeCta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the two new translation keys and remove the two now-unused ones (English)**

In `messages/en.json`, inside `"properties" → "detail"`, replace:

```json
    "detail": {
      "aboutTitle": "About This Room",
      "amenitiesTitle": "Amenities",
      "requestToBook": "Request to Book",
      "checkAvailability": "Check Availability",
      "notFoundMetadataTitle": "Room not found — Casa de la Viuda"
    },
```

with:

```json
    "detail": {
      "aboutTitle": "About This Space",
      "amenitiesTitle": "Amenities",
      "partOfHomeBody": "This space is part of Casa de la Viuda and isn't booked separately. Guests reserve the entire home.",
      "partOfHomeCta": "Reserve the Home",
      "notFoundMetadataTitle": "Space not found — Casa de la Viuda"
    },
```

- [ ] **Step 3: Same edit in Spanish**

In `messages/es.json`, inside `"properties" → "detail"`, replace:

```json
    "detail": {
      "aboutTitle": "Sobre Esta Habitación",
      "amenitiesTitle": "Comodidades",
      "requestToBook": "Solicitar Reserva",
      "checkAvailability": "Consultar Disponibilidad",
      "notFoundMetadataTitle": "Habitación no encontrada — Casa de la Viuda"
    },
```

with:

```json
    "detail": {
      "aboutTitle": "Sobre Este Espacio",
      "amenitiesTitle": "Comodidades",
      "partOfHomeBody": "Este espacio es parte de Casa de la Viuda y no se reserva por separado. Los huéspedes reservan toda la casa.",
      "partOfHomeCta": "Reservar la Casa",
      "notFoundMetadataTitle": "Espacio no encontrado — Casa de la Viuda"
    },
```

- [ ] **Step 4: Update the hardcoded not-found page copy**

Replace the full contents of `src/app/[locale]/properties/[slug]/not-found.tsx`:

```tsx
import { NotFoundLink } from "./NotFoundLink";

// Hardcoded English-only (no next-intl) for the same reason as NotFoundLink: any next-intl
// usage in a not-found.js boundary forces /[locale]/properties/[slug] dynamic. The <title>
// from page.tsx's generateMetadata is still localized, so title/body language can mismatch
// here on purpose — accepted tradeoff, not a bug.
export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">
        We couldn&apos;t find that space
      </h1>
      <p className="mt-4 text-sm text-muted">
        The space you&apos;re looking for may have been renamed or is no
        longer part of the home.
      </p>
      <NotFoundLink />
    </div>
  );
}
```

- [ ] **Step 5: Update the hardcoded not-found link text**

In `src/app/[locale]/properties/[slug]/NotFoundLink.tsx`, replace:

```tsx
      View All Rooms & Suites
```

with:

```tsx
      View The Home
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/properties/[slug]/page.tsx src/app/[locale]/properties/[slug]/not-found.tsx src/app/[locale]/properties/[slug]/NotFoundLink.tsx messages/en.json messages/es.json
git commit -m "feat: repurpose space detail page as informational-only"
```

---

### Task 4: Rewire booking to the single home entity

**Files:**
- Modify: `src/components/booking/BookingForm.tsx`
- Modify: `src/app/[locale]/booking/page.tsx`

**Interfaces:**
- Consumes: `HomeListing` type + `home` constant (Task 1, `src/types/property.ts` / `src/data/home.ts`), `getHome()` (Task 1, `src/services/home.ts`), existing `Calendar`, `PriceTag`, `rangeIncludesUnavailable`, `createReservationRequest`, `ReservationRequest` type — all unchanged signatures.
- Produces: `BookingForm` now takes `{ home: HomeListing }` instead of `{ properties: Property[]; initialPropertySlug?: string }` — nothing later depends on the old prop shape.

- [ ] **Step 1: Rewrite `BookingForm.tsx` to drop the room/suite selector**

Replace the full contents of `src/components/booking/BookingForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createReservationRequest } from "@/services/reservations";
import { rangeIncludesUnavailable } from "@/lib/dates";
import type { HomeListing } from "@/types/property";
import type { ReservationRequest } from "@/types/reservation";

type BookingFormProps = {
  home: HomeListing;
};

type FormErrors = Partial<Record<keyof ReservationRequest, string>>;

export function BookingForm({ home }: BookingFormProps) {
  const t = useTranslations("booking.form");
  const tConfirmation = useTranslations("booking.confirmation");

  const [form, setForm] = useState<ReservationRequest>({
    propertySlug: home.slug,
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

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!form.guestName.trim()) nextErrors.guestName = t("errors.guestName");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t("errors.email");
    if (!form.phone.trim()) nextErrors.phone = t("errors.phone");
    if (!form.checkIn) nextErrors.checkIn = t("errors.checkIn");
    if (!form.checkOut) nextErrors.checkOut = t("errors.checkOut");
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      nextErrors.checkOut = t("errors.checkOutBeforeCheckIn");
    }
    if (
      form.checkIn &&
      form.checkOut &&
      rangeIncludesUnavailable(form.checkIn, form.checkOut, home.unavailableDates)
    ) {
      nextErrors.checkIn = t("errors.unavailableRange");
    }
    if (form.guests < 1) {
      nextErrors.guests = t("errors.guestsMin");
    } else if (form.guests > home.maxGuests) {
      nextErrors.guests = t("errors.guestsMax", { count: home.maxGuests });
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
          {tConfirmation("eyebrow")}
        </p>
        <h2 className="mt-4 font-display text-2xl text-ink">
          {tConfirmation("title", { name: form.guestName.split(" ")[0] })}
        </h2>
        <p className="mt-3 text-sm text-ink/70">
          {tConfirmation("referencePrefix")}{" "}
          <span className="font-medium text-ink">{confirmationId}</span>.{" "}
          {tConfirmation("referenceSuffix")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 sm:grid-cols-2">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.fullName")}
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
          {t("labels.email")}
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
          {t("labels.phone")}
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
          {t("labels.guests")}
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
          {t("labels.checkIn")}
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
          {t("labels.checkOut")}
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
          {t("labels.message")}
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
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Rewrite the booking page to fetch the home and show price/amenities/calendar above the form**

Replace the full contents of `src/app/[locale]/booking/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getHome } from "@/services/home";
import { BookingForm } from "@/components/booking/BookingForm";
import { Calendar } from "@/components/properties/Calendar";
import { PriceTag } from "@/components/ui/PriceTag";
import { SectionHeading } from "@/components/ui/SectionHeading";

type BookingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "booking.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("booking.heading");
  const tProperties = await getTranslations("properties.detail");
  const home = await getHome();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

      <div className="mt-12 border border-cream-line p-6">
        <PriceTag pricePerNight={home.pricePerNight} />
        <p className="mt-4 text-sm leading-7 text-ink/70">{home.description}</p>

        <h2 className="mt-8 font-display text-xl text-ink">
          {tProperties("amenitiesTitle")}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
          {home.amenities.map((amenity) => (
            <li key={amenity} className="flex items-center gap-2">
              <span className="h-1 w-1 bg-sage" />
              {amenity}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Calendar unavailableDates={home.unavailableDates} />
        </div>
      </div>

      <div className="mt-12">
        <BookingForm home={home} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/BookingForm.tsx src/app/[locale]/booking/page.tsx
git commit -m "feat: book the entire home instead of an individual room"
```

---

### Task 5: Repurpose the 5 rooms into descriptive spaces

**Files:**
- Modify: `src/types/property.ts`
- Modify: `src/data/properties.ts`

**Interfaces:**
- Consumes: nothing (by this point, Tasks 2–4 have removed every read of `pricePerNight`/`maxGuests`/`unavailableDates` on `Property`-typed values).
- Produces: final `Property` shape — `{ slug, name, category, shortDescription, description, images, cardImage?, amenities, sizeSqm, bedConfiguration? }` — consumed by `PropertyCard`, `properties/[slug]/page.tsx`, `PropertyGrid`, `FeaturedProperties` (all already compatible from Tasks 2–3).

- [ ] **Step 1: Remove the booking-only fields from the `Property` type**

In `src/types/property.ts`, replace the `Property` type:

```ts
export type Property = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  cardImage?: string;
  amenities: string[];
  maxGuests: number;
  sizeSqm: number;
  pricePerNight: number;
  bedConfiguration: string;
  unavailableDates: string[];
};
```

with:

```ts
export type Property = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  cardImage?: string;
  amenities: string[];
  sizeSqm: number;
  bedConfiguration?: string;
};
```

(`HomeListing`, added in Task 1, stays unchanged below it.)

- [ ] **Step 2: Rewrite the 5 space entries**

Replace the full contents of `src/data/properties.ts`:

```ts
import type { Property } from "@/types/property";

export const properties: Property[] = [
  {
    slug: "deluxe-suite",
    name: "Master Bedroom",
    category: "Bedroom",
    shortDescription:
      "A sea-facing bedroom with a private terrace and soaking tub.",
    description:
      "The home's largest bedroom pairs a king bed with a separate sitting area and a private terrace overlooking the pool and coastline. Finished in warm oak and linen, the Master Bedroom is built for slow mornings and long evenings by the water.",
    images: ["Sea-facing terrace", "King bedroom", "Marble soaking tub"],
    cardImage: "/images/double_room.png",
    amenities: [
      "Private terrace",
      "Soaking tub",
      "Espresso machine",
      "Air conditioning",
      "King bed",
      "Sea view",
    ],
    sizeSqm: 42,
    bedConfiguration: "1 King Bed",
  },
  {
    slug: "pool-view-room",
    name: "Second Bedroom",
    category: "Bedroom",
    shortDescription: "A bright second bedroom overlooking the infinity pool.",
    description:
      "A calm, light-filled bedroom with direct views over the infinity pool and cabanas — steps from the water without giving up quiet.",
    images: ["Pool-view balcony", "Queen bedroom", "Walk-in shower"],
    cardImage: "/images/single_room_2.png",
    amenities: [
      "Pool view",
      "Walk-in shower",
      "Air conditioning",
      "Queen bed",
      "Minibar",
    ],
    sizeSqm: 28,
    bedConfiguration: "1 Queen Bed",
  },
  {
    slug: "garden-apartment",
    name: "Living Room & Kitchen",
    category: "Living Space",
    shortDescription:
      "The home's shared living area and full kitchen, opening onto the garden.",
    description:
      "A self-contained living and dining area with a full kitchen, opening directly onto Casa de la Viuda's landscaped gardens — the heart of the home for gathering, cooking, and relaxing together.",
    images: ["Garden terrace", "Living area", "Full kitchen"],
    cardImage: "/images/single_room.png",
    amenities: [
      "Garden terrace",
      "Full kitchen",
      "Dining area",
      "Air conditioning",
      "Sofa seating",
    ],
    sizeSqm: 55,
  },
  {
    slug: "junior-suite",
    name: "Reading Nook",
    category: "Den",
    shortDescription: "A quiet den with a reading nook and courtyard view.",
    description:
      "A refined, quiet corner of the home overlooking the inner courtyard, with a dedicated reading nook and a deep soaking tub — a calm counterpoint to the pool-facing rooms.",
    images: ["Courtyard view", "Reading nook", "Soaking tub"],
    amenities: [
      "Courtyard view",
      "Reading nook",
      "Soaking tub",
      "Air conditioning",
    ],
    sizeSqm: 34,
  },
  {
    slug: "ocean-terrace-room",
    name: "Garden Terrace",
    category: "Outdoor",
    shortDescription:
      "A ground-floor terrace and outdoor space with direct garden access.",
    description:
      "Ground-floor and steps from the shoreline path, the Garden Terrace has its own outdoor lounge and outdoor shower — the closest outdoor space to the water at Casa de la Viuda.",
    images: ["Private sun terrace", "Outdoor shower", "Outdoor lounge"],
    amenities: [
      "Private terrace",
      "Outdoor shower",
      "Direct beach access",
      "Outdoor lounge seating",
    ],
    sizeSqm: 30,
  },
];
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

Run: `grep -rn "pricePerNight\|maxGuests\|unavailableDates" src/components/properties src/app/\[locale\]/properties`
Expected: no matches (confirms no leftover reference to the removed `Property` fields outside the home/booking files).

- [ ] **Step 4: Commit**

```bash
git add src/types/property.ts src/data/properties.ts
git commit -m "feat: repurpose the 5 rooms into descriptive home spaces"
```

---

### Task 6: Copy pass — remove remaining suite/room framing

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`
- Modify: `src/components/home/AboutSection.tsx`

**Interfaces:**
- Consumes: nothing new (pure content edit; all keys referenced already exist or are being removed from files that no longer read them, per Tasks 3–4).
- Produces: nothing consumed by later tasks (this is the last content task before final verification).

- [ ] **Step 1: Replace `messages/en.json` in full**

```json
{
  "nav": {
    "home": "Home",
    "properties": "The Home",
    "book": "Book",
    "toggleMenu": "Toggle navigation menu",
    "languageSwitcher": { "en": "EN", "es": "ES" }
  },
  "layout": {
    "title": "Casa de la Viuda",
    "description": "A place to relax and enjoy the life. Reserve the entire Casa de la Viuda vacation home."
  },
  "home": {
    "hero": {
      "imageAlt": "The rocky coastline and lighthouse by Casa de la Viuda",
      "eyebrow": "01 — Welcome to Casa de la Viuda",
      "title": "Great Experiences at Casa de la Viuda",
      "subtitle": "A place to relax and enjoy the life"
    },
    "about": {
      "eyebrow": "02 — About Casa de la Viuda",
      "since": "Since 1986",
      "category": "Private Vacation Home",
      "hotlineLabel": "Reservation hotline:",
      "hotlineAvailability": "Reservation assistance available 24 hours",
      "paragraphOne": "Since 1986, Casa de la Viuda has welcomed guests to a quiet stretch of coastline built around a single idea: a place to relax and enjoy the life. The entire home — every bedroom, the shared living spaces, and the garden — is reserved by one group of guests at a time.",
      "paragraphTwo": "From the poolside terrace to the garden-facing kitchen, every stay comes with the same attention to detail our guests have returned for across four decades of hospitality.",
      "stats": {
        "rooms": "Spaces in the Home",
        "years": "Years of Hospitality",
        "rating": "Guest Rating"
      }
    },
    "featured": {
      "eyebrow": "03 — Inside the Home",
      "title": "Explore the Spaces",
      "viewAll": "See Every Space"
    },
    "cta": {
      "eyebrow": "04 — Ready When You Are",
      "title": "Request Your Stay at Casa de la Viuda",
      "body": "Tell us your dates and party size — our team confirms every request within 24 hours.",
      "button": "Start Booking Request"
    }
  },
  "properties": {
    "metadata": {
      "title": "The Home — Casa de la Viuda",
      "description": "Explore every space inside Casa de la Viuda, reserved as one whole vacation home."
    },
    "listing": {
      "eyebrow": "Stay With Us",
      "title": "The Home"
    },
    "detail": {
      "aboutTitle": "About This Space",
      "amenitiesTitle": "Amenities",
      "partOfHomeBody": "This space is part of Casa de la Viuda and isn't booked separately. Guests reserve the entire home.",
      "partOfHomeCta": "Reserve the Home",
      "notFoundMetadataTitle": "Space not found — Casa de la Viuda"
    },
    "notFound": {
      "eyebrow": "404",
      "title": "We couldn't find that space",
      "body": "The space you're looking for may have been renamed or is no longer part of the home."
    }
  },
  "booking": {
    "metadata": {
      "title": "Request a Booking — Casa de la Viuda",
      "description": "Request a reservation for the entire Casa de la Viuda vacation home."
    },
    "heading": {
      "eyebrow": "Request a Stay",
      "title": "Reserve the Home"
    },
    "form": {
      "labels": {
        "fullName": "Full Name",
        "email": "Email",
        "phone": "Phone",
        "guests": "Guests",
        "checkIn": "Check-in",
        "checkOut": "Check-out",
        "message": "Message (optional)"
      },
      "errors": {
        "guestName": "Enter your full name.",
        "email": "Enter a valid email.",
        "phone": "Enter a phone number.",
        "checkIn": "Choose a check-in date.",
        "checkOut": "Choose a check-out date.",
        "checkOutBeforeCheckIn": "Check-out must be after check-in.",
        "unavailableRange": "These dates include an unavailable date. Please choose another range.",
        "guestsMin": "At least 1 guest is required.",
        "guestsMax": "This home sleeps up to {count} guests."
      },
      "submitting": "Sending Request…",
      "submit": "Send Booking Request"
    },
    "confirmation": {
      "eyebrow": "Request Received",
      "title": "Thank you, {name}.",
      "referencePrefix": "Confirmation reference",
      "referenceSuffix": "Our team will confirm availability by email within 24 hours."
    }
  },
  "calendar": {
    "weekdays": ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    "previousMonth": "Previous month",
    "nextMonth": "Next month",
    "unavailable": "Unavailable",
    "selected": "Selected"
  },
  "gallery": {
    "noPhotos": "No photos yet",
    "showPhoto": "Show photo: {label}"
  },
  "priceTag": {
    "perNight": "/ night"
  }
}
```

- [ ] **Step 2: Replace `messages/es.json` in full**

```json
{
  "nav": {
    "home": "Inicio",
    "properties": "La Casa",
    "book": "Reservar",
    "toggleMenu": "Alternar menú de navegación",
    "languageSwitcher": { "en": "EN", "es": "ES" }
  },
  "layout": {
    "title": "Casa de la Viuda",
    "description": "Un lugar para relajarse y disfrutar la vida. Reservá toda la casa de vacaciones Casa de la Viuda."
  },
  "home": {
    "hero": {
      "imageAlt": "La costa rocosa y el faro junto a Casa de la Viuda",
      "eyebrow": "01 — Bienvenido a Casa de la Viuda",
      "title": "Grandes Experiencias en Casa de la Viuda",
      "subtitle": "Un lugar para relajarse y disfrutar la vida"
    },
    "about": {
      "eyebrow": "02 — Sobre Casa de la Viuda",
      "since": "Desde 1986",
      "category": "Casa de Vacaciones Privada",
      "hotlineLabel": "Línea de reservas:",
      "hotlineAvailability": "Asistencia de reservas disponible las 24 horas",
      "paragraphOne": "Desde 1986, Casa de la Viuda ha recibido a sus huéspedes en un tranquilo tramo de costa construido alrededor de una sola idea: un lugar para relajarse y disfrutar la vida. Toda la casa —cada dormitorio, los espacios compartidos y el jardín— se reserva para un solo grupo de huéspedes a la vez.",
      "paragraphTwo": "Desde la terraza junto a la piscina hasta la cocina con vista al jardín, cada estadía cuenta con la misma atención al detalle por la que nuestros huéspedes han vuelto durante cuatro décadas de hospitalidad.",
      "stats": {
        "rooms": "Espacios en la Casa",
        "years": "Años de Hospitalidad",
        "rating": "Calificación de Huéspedes"
      }
    },
    "featured": {
      "eyebrow": "03 — Dentro de la Casa",
      "title": "Explorá los Espacios",
      "viewAll": "Ver Todos los Espacios"
    },
    "cta": {
      "eyebrow": "04 — Cuando Estés Listo",
      "title": "Reservá Tu Estadía en Casa de la Viuda",
      "body": "Contanos tus fechas y la cantidad de huéspedes — nuestro equipo confirma cada solicitud dentro de las 24 horas.",
      "button": "Iniciar Solicitud de Reserva"
    }
  },
  "properties": {
    "metadata": {
      "title": "La Casa — Casa de la Viuda",
      "description": "Explorá cada espacio dentro de Casa de la Viuda, reservada como una sola casa de vacaciones."
    },
    "listing": {
      "eyebrow": "Alojate con Nosotros",
      "title": "La Casa"
    },
    "detail": {
      "aboutTitle": "Sobre Este Espacio",
      "amenitiesTitle": "Comodidades",
      "partOfHomeBody": "Este espacio es parte de Casa de la Viuda y no se reserva por separado. Los huéspedes reservan toda la casa.",
      "partOfHomeCta": "Reservar la Casa",
      "notFoundMetadataTitle": "Espacio no encontrado — Casa de la Viuda"
    },
    "notFound": {
      "eyebrow": "404",
      "title": "No pudimos encontrar ese espacio",
      "body": "El espacio que buscás puede haber sido renombrado o ya no es parte de la casa."
    }
  },
  "booking": {
    "metadata": {
      "title": "Solicitar una Reserva — Casa de la Viuda",
      "description": "Solicitá una reserva para toda la casa de vacaciones Casa de la Viuda."
    },
    "heading": {
      "eyebrow": "Solicitar una Estadía",
      "title": "Reservá la Casa"
    },
    "form": {
      "labels": {
        "fullName": "Nombre Completo",
        "email": "Correo Electrónico",
        "phone": "Teléfono",
        "guests": "Huéspedes",
        "checkIn": "Entrada",
        "checkOut": "Salida",
        "message": "Mensaje (opcional)"
      },
      "errors": {
        "guestName": "Ingresá tu nombre completo.",
        "email": "Ingresá un correo electrónico válido.",
        "phone": "Ingresá un número de teléfono.",
        "checkIn": "Elegí una fecha de entrada.",
        "checkOut": "Elegí una fecha de salida.",
        "checkOutBeforeCheckIn": "La fecha de salida debe ser posterior a la de entrada.",
        "unavailableRange": "Estas fechas incluyen una fecha no disponible. Elegí otro rango.",
        "guestsMin": "Se requiere al menos 1 huésped.",
        "guestsMax": "Esta casa admite hasta {count} huéspedes."
      },
      "submitting": "Enviando Solicitud…",
      "submit": "Enviar Solicitud de Reserva"
    },
    "confirmation": {
      "eyebrow": "Solicitud Recibida",
      "title": "Gracias, {name}.",
      "referencePrefix": "Referencia de confirmación",
      "referenceSuffix": "Nuestro equipo confirmará la disponibilidad por correo electrónico dentro de las 24 horas."
    }
  },
  "calendar": {
    "weekdays": ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
    "previousMonth": "Mes anterior",
    "nextMonth": "Mes siguiente",
    "unavailable": "No disponible",
    "selected": "Seleccionado"
  },
  "gallery": {
    "noPhotos": "Sin fotos por el momento",
    "showPhoto": "Mostrar foto: {label}"
  },
  "priceTag": {
    "perNight": "/ noche"
  }
}
```

- [ ] **Step 3: Update the two hardcoded strings in `AboutSection.tsx`**

In `src/components/home/AboutSection.tsx`, replace:

```tsx
  const stats = [
    { label: t("stats.rooms"), value: "10" },
```

with:

```tsx
  const stats = [
    { label: t("stats.rooms"), value: "5" },
```

And replace:

```tsx
            <p className="mt-5 text-sm font-semibold tracking-[0.1em]">
              CASA DE LA VIUDA — RESORT
            </p>
```

with:

```tsx
            <p className="mt-5 text-sm font-semibold tracking-[0.1em]">
              CASA DE LA VIUDA
            </p>
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (JSON must stay valid — both files are consumed by `src/global.d.ts`'s typed-messages augmentation, so a malformed key would surface as a `tsc` error anywhere a removed key is still referenced).

Run: `grep -rin "suite\|room selection\|choose a room" messages src/components/home src/app/\[locale\]/properties src/app/\[locale\]/booking`
Expected: no matches (confirms no leftover "suite"/room-selection framing in the touched areas).

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/es.json src/components/home/AboutSection.tsx
git commit -m "content: remove remaining suite/room framing from copy"
```

---

### Task 7: Full verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck, lint, and production build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed with no errors. A successful `next build` also re-confirms `generateStaticParams` in `properties/[slug]/page.tsx` still produces exactly 5 static routes.

- [ ] **Step 2: Manual walkthrough — English**

Run: `npm run dev`, then in a browser:
1. Visit `/en` — confirm the hero/about/featured sections read as a single-home property, layout unchanged, no "10 rooms" or "resort" language visible.
2. Visit `/en/properties` — confirm the grid shows 5 spaces, no prices or "book" links on the cards.
3. Visit `/en/properties/garden-apartment` — confirm it shows "Living Room & Kitchen" with a description, gallery, features list, and a sidebar box that links to `/en/booking` (no price/calendar on this page).
4. Visit `/en/booking` — confirm it shows the whole-home price, description, amenities list, and calendar, then the form below with no room/suite selector.
5. Submit the form with valid data — confirm the confirmation screen appears.
6. Visit `/en/properties/does-not-exist` — confirm the not-found page reads "We couldn't find that space" with a "View The Home" link.

- [ ] **Step 3: Manual walkthrough — Spanish**

Repeat Step 2 under `/es/...` — confirm equivalent Spanish copy renders correctly and no fallback/English leakage appears outside the known `not-found.tsx` exception (documented in its own comment).

- [ ] **Step 4: Final commit (only if Step 1–3 surfaced fixes)**

If any issues were found and fixed during manual walkthrough:

```bash
git add -A
git commit -m "fix: address issues found in single-property conversion walkthrough"
```

If no issues were found, no commit is needed for this task.
