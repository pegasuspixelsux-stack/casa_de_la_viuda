# Elios — Public Website (Phase 1, Sub-project 1) — Design

## Context

Elios is a hospitality management platform for a single hospitality operator (not a
marketplace, not multi-tenant). Version 1 has two independent subsystems:

1. **Public website** — guest-facing (this spec)
2. **Admin dashboard** — operator-facing (separate spec, built after this one)

This spec covers only the public website. Phase 1 has no backend: Firebase is a later
phase. All data is static/mock, structured so the data-access layer is the seam that
gets swapped for real Firebase calls without touching UI code.

A design was imported from Claude Design (`EskorHotel.dc.html`, project
`26fe64b7-aee6-4a1c-b3c0-79768ff9c953`) containing two homepage concepts for "Eskor
Hotel" — the single property this Elios instance represents. This spec adopts
**DESIGN 1** (centered top nav, full-bleed hero, right-aligned hero copy, bottom
contact bar, "About/History Since 1986" section) as the homepage foundation, with a
**white background** for the hero/about area (the source mockup used a cream
`#f4f1ec` background there; cream is kept for other secondary sections only).

The two files uploaded into that design project (`uploads/*.webp`) are full-page
composite screenshots (design references / thumbnails), not raw usable photography —
Phase 1 uses styled placeholder imagery instead of licensed photos (see §6).

## 1. Scope & Pages

| Route | Purpose |
|---|---|
| `/` | Homepage: hero → about/history → featured room types → booking CTA |
| `/properties` | Grid of all room/unit types |
| `/properties/[slug]` | Detail page: gallery, description, amenities, availability calendar, "Request to Book" CTA |
| `/booking` | Reservation request form; accepts `?property=<slug>` to pre-fill |

The homepage's "featured room types + booking CTA" section is **not** in the source
mockup (which stops after the about section) — it's added because the homepage needs
to funnel visitors into `/properties` and `/booking`.

Explicitly out of scope for this sub-project: `/admin/*` (separate spec), filtering/
search UI on `/properties` (grid only for v1), payments, real backend persistence.

## 2. Architecture

- Next.js 16 App Router, TypeScript (strict), Tailwind v4, React 19. Server Components
  by default; Client Components only where interaction requires it.
- **`src/services/`** is the data-access seam:
  - `properties.ts` — `getProperties()`, `getPropertySlugs()`, `getPropertyBySlug(slug)`
  - `reservations.ts` — `createReservationRequest(input)`
  - Each function is `async` and returns static/mock data with a small artificial
    delay (simulates network latency so the async boundaries behave like they will
    once backed by Firebase). This is the **only** place that changes when Firebase
    is introduced.
- **`cacheComponents` stays disabled.** Next 16's opt-in PPR/`use cache` model
  (`next.config.ts` → `cacheComponents: true`) adds Suspense-boundary requirements
  that aren't justified when the underlying data is static in-memory arrays, not real
  I/O. Revisit this when Firebase lands.
- `/properties/[slug]` uses `generateStaticParams` (slugs known at build time) — fully
  static prerendering.
- Next.js 16 conventions followed: `params`/`searchParams` are `Promise`s and must be
  `await`ed (breaking change from 15); no reliance on synchronous access.
- No `middleware`/`proxy` needed in this sub-project (no auth yet).

## 3. Data model (`src/types/`)

```ts
type Property = {
  slug: string
  name: string
  category: string // e.g. "Suite", "Room", "Apartment"
  shortDescription: string
  description: string
  images: string[] // placeholder identifiers in Phase 1
  amenities: string[]
  maxGuests: number
  sizeSqm: number
  pricePerNight: number
  bedConfiguration: string
  unavailableDates: string[] // ISO date strings, mock-blocked dates
}

type ReservationRequest = {
  propertySlug: string
  guestName: string
  email: string
  phone: string
  checkIn: string // ISO date
  checkOut: string // ISO date
  guests: number
  message?: string
}

type Reservation = ReservationRequest & {
  id: string
  status: 'pending'
  createdAt: string // ISO datetime
}
```

Mock data seeds 4–6 room/unit types for Eskor Hotel (e.g. Deluxe Suite, Pool View
Room, Garden Apartment, Junior Suite), each with a handful of pre-blocked
`unavailableDates` so the calendar reads as real in a demo.

## 4. Components (`src/components/`)

- `Navbar` — top nav (server), mobile menu toggle is a small client island
- `Footer`
- `Hero` — homepage hero section (server; renders `PhotoPlaceholder` for imagery)
- `PropertyCard` — used in `/properties` grid and homepage "featured" section
- `Gallery` — client component, lightbox/carousel for property detail images
- `BookingForm` — client component; client-side validation, calls
  `services/reservations.ts`, shows inline confirmation state on submit (no
  persistence — resolves the request and displays success, per Phase 1 scope)
- `Calendar` — client component; renders a month grid, marks `unavailableDates`.
  Built as a standalone reusable component so `/admin/calendar` can reuse it later.
- `SectionHeading`, `PhotoPlaceholder`, `PriceTag` — small presentational pieces

## 5. Visual language

- Fonts via `next/font/google`: **Cormorant Garamond** (serif — headings/display),
  **Jost** (sans — body/UI), matching the imported design.
- Palette: navy `#1c2b3a` (text), sage `#6f9c97` (accent/CTA), warm cream `#f4f1ec`
  (secondary section backgrounds). Homepage hero/about area is **white**, not cream.
- Uppercase micro-labels with wide letter-spacing, thin dividers — editorial hotel
  aesthetic from the source mockup, carried through `/properties` and `/booking` too
  for visual consistency.
- Mobile-first, responsive at Tailwind's standard breakpoints.

## 6. Imagery

No licensed property photography exists yet. A `PhotoPlaceholder` component (styled
gradient block, echoes the source design's own "image-slot" placeholder pattern)
stands in everywhere a real photo would go — hero, gallery, property cards. Swapping
in real photos later is a matter of replacing `PhotoPlaceholder` usages with
`next/image`, not a structural change.

## 7. Error handling & validation

- `not-found.tsx` for `/properties/[slug]` when the slug doesn't match any property
  (calls `notFound()`).
- `BookingForm` validates client-side only (required fields, date range sanity,
  guest count vs. `maxGuests`) — there's no backend to validate against yet.

## 8. Testing

No automated test framework is introduced in this phase — it's explicitly a
frontend-architecture/UX prototype. Verification is manual: run the dev server and
exercise the golden path (browse → view property → check availability → submit
booking) plus edge cases (invalid slug, form validation) before calling work done.

## Explicitly deferred (not in this sub-project)

- Admin dashboard (`/admin/*`) — separate spec, built next
- Firebase / real persistence
- Payments
- Search/filtering on `/properties`
- Multi-property / multi-tenant support
- Real photography
