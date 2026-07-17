# Elios Public Website — Bilingual (EN/ES) Support — Design

## Context

The public website (homepage, `/properties`, `/properties/[slug]`, `/booking`)
currently exists as flat routes under `src/app/` with all user-facing text
hardcoded in English (see the [public website design spec](2026-07-17-elios-public-website-design.md)
and [implementation plan](../plans/2026-07-17-elios-public-website.md) for the
existing architecture). This spec adds English and Spanish locale support via
URL-prefixed routing (`/en`, `/es`), a language switcher in the nav, and a
translation-file-driven text layer — without changing the design, layout, or
component structure.

## 1. Scope

**In scope:** all static UI chrome — navigation, buttons, headings, form
labels and validation messages, the calendar widget's labels, the 404 page,
page `<title>`/description metadata, and the homepage's hero/about/CTA copy.

**Explicitly out of scope:**

- **Room catalog content** (`src/data/properties.ts` — each room's `name`,
  `category`, `shortDescription`, `description`, `amenities`,
  `bedConfiguration`) stays English-only in both locales this phase.
  `src/services/properties.ts` is untouched — no locale parameter added.
- **`Footer`'s contact block** (brand name, address, phone, email) — proper
  nouns and contact data, identical in both languages, so it stays a plain
  constant rather than being routed through translation keys.
- **`AboutSection`'s stat values** (`10`, `40`, `4.9`) and the `V` monogram —
  locale-invariant; only the stat *labels* ("Rooms & Suites", "Years of
  Hospitality", "Guest Rating") are translated.
- Admin dashboard (not yet built — separate future sub-project).

## 2. Library: `next-intl`

Chosen over hand-rolled dictionaries (Next.js's own documented pattern) and
over next-i18next. Reasoning:

- Its file convention (`messages/en.json`, `messages/es.json`) matches what
  was specified for this feature — not a coincidence, it's the App Router
  i18n ecosystem standard, and it's the library Next.js's own
  internationalization guide links to.
- Requirement: the language switcher must preserve the current page *and*
  query string (e.g. `/booking?property=deluxe-suite`) when switching
  languages, with client-side navigation. next-intl's `usePathname()` /
  `useRouter()` (re-exported from a per-project `src/i18n/navigation.ts`)
  strip/re-add the locale segment automatically and hand back the rest of
  the URL untouched — this is exactly the primitive the requirement needs.
  Reimplementing this by hand (path parsing, query preservation, active-tab
  state) is meaningfully more surface area to get subtly wrong.
- Confirmed compatible with Next.js 16's `proxy.ts` file convention (the
  `middleware.ts` → `proxy.ts` rename): `createMiddleware` from
  `next-intl/middleware` is unchanged internally; only the file it's placed
  in changes name. (Next.js's own `proxy.js` file-convention doc: "The file
  must export a single function, either as a default export or named
  `proxy`" — `export default createMiddleware(routing)` satisfies this
  directly.)

## 3. Routing restructure

Every existing route moves under a `[locale]` dynamic segment:

```
src/app/
  favicon.ico                    (stays — not locale-specific)
  globals.css                    (stays)
  [locale]/
    layout.tsx                   (was app/layout.tsx)
    page.tsx                     (was app/page.tsx)
    properties/
      page.tsx                   (was app/properties/page.tsx)
      [slug]/
        page.tsx                 (was app/properties/[slug]/page.tsx)
        not-found.tsx            (was app/properties/[slug]/not-found.tsx)
    booking/
      page.tsx                   (was app/booking/page.tsx)
src/proxy.ts                     (new — locale negotiation/redirect)
src/i18n/
  routing.ts                     (new — locales, defaultLocale, localePrefix)
  navigation.ts                  (new — locale-aware Link/useRouter/usePathname/redirect)
  request.ts                     (new — getRequestConfig: loads messages/<locale>.json)
messages/
  en.json                        (new)
  es.json                        (new)
next.config.ts                   (modified — wrapped with createNextIntlPlugin())
```

`src/i18n/routing.ts` configures `locales: ['en', 'es']`,
`defaultLocale: 'en'`, and `localePrefix: 'always'` — the last setting is
what makes `/` redirect to `/en` (or `/es` per `Accept-Language`) rather than
serving English unprefixed at the root, matching "English (default): /en"
literally.

`generateStaticParams` on the `[locale]` layout returns both locales so
every route still prerenders statically per locale (matching the existing
site's static-generation approach — `/properties/[slug]` keeps its own
`generateStaticParams`, now producing `{ locale, slug }` pairs for all 2×5
combinations).

## 4. Language switcher

A new small Client Component, rendered inside both `Navbar` (desktop nav)
and `MobileMenuToggle` (mobile dropdown) so it's reachable regardless of
viewport. Displays `EN | ES`; the active locale is visually distinguished
(bold/full-opacity vs. muted, not just a color swap, so it also reads in the
transparent-over-hero nav state). Uses `usePathname()` / `useRouter()` from
`src/i18n/navigation.ts`: `router.replace(pathname, { locale: nextLocale })`
— client-side, preserves the current path and query string.

## 5. Translation key structure

Grouped by feature area, mirroring the component tree:

```json
{
  "nav": { "home", "properties", "book", "languageSwitcher": { "en", "es" } },
  "home": { "hero": {...}, "about": {...}, "featured": {...}, "cta": {...} },
  "properties": { "listing": {...}, "detail": {...}, "notFound": {...} },
  "booking": { "form": { "labels": {...}, "errors": {...} }, "confirmation": {...} },
  "calendar": { "weekdays": [...], "unavailable", "selected", "previousMonth", "nextMonth" },
  "gallery": { "noPhotos", "showPhoto" },
  "priceTag": { "perNight" },
  "metadata": { "home": {...}, "properties": {...}, "booking": {...} }
}
```

Server Components (`page.tsx` files, `FeaturedProperties`) use
`getTranslations()`; Client Components (`Navbar`, `MobileMenuToggle`,
`Calendar`, `Gallery`, `BookingForm`, the new language switcher) use
`useTranslations()`.

## 6. Locale-aware formatting

`src/lib/dates.ts`'s `formatPrice` and `formatDateLong`, and `Calendar`'s
month label (currently `toLocaleDateString("en-US", ...)`), take a `locale`
parameter so currency/date formatting genuinely shifts with the language —
Spanish renders via `es-UY` (matching the property's Uruguay location), not
just translated labels around still-English-formatted numbers.

## 7. Components requiring changes

Every component/page currently importing `Link` from `next/link` switches to
the locale-aware `Link` from `src/i18n/navigation.ts` (so internal links stay
within the current locale). Components with hardcoded text
(`Navbar`, `MobileMenuToggle`, `Hero`, `AboutSection`, `BookingCta`,
`FeaturedProperties`, `PropertyCard`, `Calendar`, `Gallery`, `PriceTag`,
`BookingForm`, all four `page.tsx` files, `not-found.tsx`) get their strings
replaced with translation calls. `SectionHeading` and `PhotoPlaceholder` take
`eyebrow`/`title`/`label` as props already — no internal change needed, only
their callers now pass translated strings.

## 8. Verification

No automated test framework in this project (existing, documented
convention) — verification stays `npx tsc --noEmit`, `npm run build`,
`npm run lint`, plus a manual dev-server pass confirming: `/` redirects to
`/en` (or `/es` per browser language), both `/en` and `/es` render every
route, the switcher preserves the current path *and* query string (tested
specifically on `/en/booking?property=deluxe-suite` → switch → `/es/booking?property=deluxe-suite`),
active-locale highlighting is correct, and all in-scope UI text actually
changes language while room catalog content and the footer stay as
documented in §1.
