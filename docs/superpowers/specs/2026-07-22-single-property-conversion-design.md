# Single-Property Conversion Design

## Context

Elios ("Casa de la Viuda") currently models the business as a small hotel: 5
independently bookable rooms/suites, each with its own price, max guests,
availability calendar, and a room/suite selector in the booking form
(`src/data/properties.ts`, `src/components/booking/BookingForm.tsx`,
`src/app/[locale]/properties/[slug]/page.tsx`).

`PROJECT.md` already states the intended business model for v1 is a **single
property business**. This spec converts the codebase to match: guests always
reserve the entire vacation home, never an individual room. The five existing
room/suite pages become purely descriptive "spaces" showcasing what's included
in the home.

**Hard constraint:** no redesign. Layout, styling, spacing, typography,
colors, navigation structure, component structure, and responsive behavior
stay visually identical. Only the minimum content/data/logic changes needed to
reflect the new business model.

## Decisions (confirmed with user)

1. Keep the existing 5 property slugs/routes as-is, repurposed into 5
   descriptive spaces (no new routes added, no route removed).
2. Nav item and page copy currently reading "Rooms & Suites" becomes
   "The Home".
3. Whole-home price/maxGuests/availability are computed placeholders derived
   from the existing 5 rooms' data (not real figures):
   - `maxGuests` = sum of the 5 rooms' `maxGuests` = 14
   - `unavailableDates` = union of the 5 rooms' `unavailableDates`
   - `pricePerNight` = 890 (a single whole-home nightly rate, chosen to sit
     above any individual current room rate while being less than the sum of
     all 5 — consistent with a whole-home premium over per-room pricing)

## Data model

### New: `src/types/property.ts` gains a `HomeListing` type

```ts
export type HomeListing = {
  slug: string;
  name: string;
  description: string;
  amenities: string[];
  images: string[];
  heroImage?: string;
  pricePerNight: number;
  maxGuests: number;
  unavailableDates: string[];
};
```

### New: `src/data/home.ts`

Exports a single `home: HomeListing` constant — name "Casa de la Viuda",
whole-property description, property-wide amenities (Wi-Fi, full kitchen,
private parking, A/C, garden, pool, BBQ, laundry, workspace, smart TV),
computed `pricePerNight`/`maxGuests`/`unavailableDates` per the Decisions
section above.

### New: `src/services/home.ts`

```ts
export async function getHome(): Promise<HomeListing> { ... }
```

Same `delay()`-based mock pattern as `services/properties.ts`, same seam
comment ("gets replaced with real Firebase calls; callers don't change").

### `src/types/property.ts` — `Property` type

`pricePerNight`, `maxGuests`, `unavailableDates` become optional (`?`), since
the 5 space entries no longer use them. `bedConfiguration` and `sizeSqm` stay
required — still meaningful descriptive info for a space.

### `src/data/properties.ts`

Same file, same array shape, same `getProperties()`/`getPropertySlugs()`/
`getPropertyBySlug()` signatures (services/properties.ts untouched). The 5
entries are repurposed in place:

| Current slug/name | Becomes |
|---|---|
| deluxe-suite / Deluxe Suite | Master Bedroom |
| pool-view-room / Pool View Room | Second Bedroom |
| garden-apartment / Garden Apartment | Living Room & Kitchen |
| junior-suite / Junior Suite | Reading Nook |
| ocean-terrace-room / Ocean Terrace Room | Garden Terrace |

`pricePerNight`/`maxGuests`/`unavailableDates` are removed from each entry's
data literal. `category` values change from "Suite"/"Room"/"Apartment" to
something space-appropriate (e.g. "Bedroom", "Living Space", "Outdoor").
`amenities` per space become "features of this space" (e.g. Master Bedroom:
king bed, soaking tub, sea view, private terrace) rather than bookable perks.

## Pages

All routes, file names, and folder structure stay exactly as they are.

- **`/` (home)** — `AboutSection` copy updated from room/suite framing to a
  whole-home overview. `FeaturedProperties` unchanged structurally (still a
  3-of-5 teaser grid linking to `/properties`), but its cards no longer show
  price (see `PropertyCard` below).
- **`/properties`** — nav label "The Home" (was "Rooms & Suites"). Same grid
  layout, same `PropertyGrid`/`PropertyCard` components, now showing the 5
  spaces with no pricing/booking affordance.
- **`/properties/[slug]`** — gallery, name, description, and
  "features"/amenities list stay exactly as laid out. The right-hand sidebar
  box (`src/app/[locale]/properties/[slug]/page.tsx:83-102`) changes from
  `PriceTag` + "Request to Book" link + per-room `Calendar` to a shorter box:
  a line noting this space is part of the whole home, plus a single link to
  `/booking` (no `?property=` query param — nothing to select anymore).
  `not-found.tsx` / `NotFoundLink.tsx` copy changes "room" → "space", same
  layout.
- **`/booking`** — becomes the de facto "Stay" page. Fetches `getHome()`
  instead of `getProperties()`. Renders the home's `PriceTag` and `Calendar`
  (both components reused unmodified) above the `BookingForm`, then the form
  itself. The `?property=` search param is no longer read (nothing to
  preselect).
- **`PropertyCard`** (`src/components/properties/PropertyCard.tsx`) — drops
  `maxGuests` line-item and the `PriceTag` block. Keeps category, name,
  `sizeSqm`/`bedConfiguration` when present (some spaces, e.g. Living Room,
  may not have a `bedConfiguration` — render conditionally).

## Booking flow

`BookingForm` (`src/components/booking/BookingForm.tsx`):

- Props change from `{ properties: Property[]; initialPropertySlug?: string }`
  to `{ home: HomeListing }`.
- Removes the room/suite `<select>` block (lines 112–135) entirely, along with
  its label (`labels.roomSuite`) and error (`errors.propertySlug`).
- `selectedProperty` is replaced by the `home` prop directly — no "find by
  slug" lookup needed since there's exactly one bookable entity.
- Initial form state sets `propertySlug: home.slug` directly (not user-facing,
  not editable).
- Validation logic (unavailable-date-range overlap, guests > max) is
  unchanged in shape, just checked against `home.unavailableDates` /
  `home.maxGuests` instead of `selectedProperty`.
- `ReservationRequest` type (`src/types/reservation.ts`) and
  `src/services/reservations.ts` are untouched — the payload shape doesn't
  change, only how `propertySlug` gets populated.

## Copy / i18n (`messages/en.json`, `messages/es.json`)

Mirrored in both files:

- Nav `"properties"`: "Rooms & Suites" → "The Home"
- `home.about.*`: paragraph and "rooms" copy reframed around the whole home
- `home.featured.eyebrow/title/viewAll`: drop "Rooms & Suites" framing (e.g.
  "View All Rooms & Suites" → "See Every Space")
- `properties.metadata.title/description`, `properties.listing.title`:
  "Rooms & Suites — Casa de la Viuda" → "The Home — Casa de la Viuda", listing
  copy reframed as spaces/showcase
- `properties.detail.aboutTitle`: "About This Room" → "About This Space"
- `properties.detail.notFoundMetadataTitle` + not-found title/body: "room"
  → "space" framing
- `booking.metadata.*`, `booking.heading.title`: "Book Your Room" → "Reserve
  the Home" (or equivalent)
- `booking.form.labels.roomSuite`: removed
- `booking.form.errors.propertySlug`: removed
- `booking.form.errors.guestsMax`: "This room sleeps up to {count} guests." →
  "This home sleeps up to {count} guests."

## Out of scope / unaffected

- No admin dashboard exists yet — nothing to migrate there.
- No dedicated `/calendar` route exists — the `Calendar` component's single
  usage moves from per-room (`properties/[slug]`) to the booking page, per
  above.
- `services/reservations.ts`, `ReservationRequest` type, `lib/dates.ts`,
  `Calendar.tsx`, `Gallery.tsx`, `PriceTag.tsx` — no changes needed, reused
  as-is.
- No visual/layout/styling changes anywhere.

## Testing

No automated test suite currently exists for this content/data layer (per
project state) beyond typechecking. Verification is: `npm run build` /
`tsc` passes, and a manual pass through home → properties listing → a space
detail page → booking page → submit flow in the dev server, in both `en` and
`es` locales.
