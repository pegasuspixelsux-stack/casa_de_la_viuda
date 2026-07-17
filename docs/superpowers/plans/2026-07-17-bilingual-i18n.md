# Bilingual (EN/ES) Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English/Spanish locale routing (`/en`, `/es`) to the public website with a path-and-query-preserving language switcher, translating all static UI chrome while leaving the room catalog content and the footer's contact block unlocalized by explicit scope decision.

**Architecture:** `next-intl` v4 provides locale-prefixed routing (via `src/proxy.ts`), locale-aware navigation primitives (`src/i18n/navigation.ts`, used everywhere instead of `next/link`), and JSON-file-backed translations (`messages/en.json` / `messages/es.json`) loaded per-request (`src/i18n/request.ts`). Every existing route moves under a `src/app/[locale]/` segment. Server Components use `getTranslations()`; Client Components use `useTranslations()`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript (strict), Tailwind CSS v4, `next-intl` (new dependency — the only one this plan adds).

**Spec:** `docs/superpowers/specs/2026-07-17-bilingual-i18n-design.md`

## Global Constraints

- `next-intl` locale codes are exactly `"en"` and `"es"` — never region-qualified codes like `"es-UY"` as a *routing* locale. Region-qualified tags (`"es-UY"`, `"en-US"`) are used **only** as `Intl.NumberFormat`/`Intl.DateTimeFormat` targets via the `toIntlLocale()` helper (Task 5) — never passed to next-intl APIs.
- `localePrefix: "always"` — `/` redirects to `/en` or `/es` (via `Accept-Language` negotiation); English is never served unprefixed at the root.
- **Every internal navigational `Link` imports from `@/i18n/navigation`, never `next/link`.** This is what makes the language switcher's path preservation and every other internal link's locale-awareness work. A `next/link` import anywhere in a component that renders inside `[locale]/` is a defect.
- **`src/data/properties.ts` and `src/services/properties.ts` are not touched by this plan.** Room catalog content (name, category, description, amenities, bedConfiguration) stays English-only in both locales — this is a deliberate, documented scope decision from the spec, not an oversight.
- **These stay hardcoded, not translated** (documented exclusions from the spec, §1): `Footer`'s `CONTACT_ITEMS` (brand name, address, phone, email — proper nouns/contact data, identical in both languages); `AboutSection`'s `"CASA DE LA VIUDA — RESORT"` line and the `"V"` monogram (brand identity, not translated content, matching the Footer precedent); `AboutSection`'s stat *values* (`"10"`, `"40"`, `"4.9"` — only the stat *labels* translate).
- No automated test framework in this project (existing, documented convention). Every task's verification uses `npx tsc --noEmit`, `npm run build`, and `npm run lint` in place of unit tests. The final task adds a manual dev-server pass.
- `messages/en.json` and `messages/es.json` must always have **identical key structures** — every task that adds a translation key adds it to both files in the same shape.
- Commit after every task, staging only the files that task created or modified.

---

### Task 1: Install next-intl and create the i18n configuration layer

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`
- Create: `src/global.d.ts`
- Modify: `next.config.ts`
- Create: `messages/en.json`
- Create: `messages/es.json`

**Interfaces:**
- Produces: `routing` (from `@/i18n/routing`, exports `locales: ["en","es"]`, `defaultLocale: "en"`), `{ Link, redirect, usePathname, useRouter, getPathname }` (from `@/i18n/navigation`) — used by every component task from here on.
- Consumes: nothing new.

This task does **not** touch anything under `src/app/` — the existing flat routes keep working exactly as before. These new files are inert until Task 2 wires them in; this task's own verification only needs to confirm they're syntactically and type-correct in isolation.

- [ ] **Step 1: Install next-intl**

Run: `npm install next-intl`
Expected: `next-intl` added to `package.json` dependencies (version `^4.x`).

- [ ] **Step 2: Create `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"] as const,
  defaultLocale: "en",
  localePrefix: "always",
});
```

- [ ] **Step 3: Create `src/i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: Create `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Create `src/global.d.ts`**

```ts
import { routing } from "@/i18n/routing";
import messages from "../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
```

- [ ] **Step 6: Replace `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Create `messages/en.json`**

```json
{
  "nav": {
    "home": "Home",
    "properties": "Rooms & Suites",
    "book": "Book",
    "toggleMenu": "Toggle navigation menu",
    "languageSwitcher": { "en": "EN", "es": "ES" }
  },
  "layout": {
    "title": "Casa de la Viuda",
    "description": "A place to relax and enjoy the life. Book rooms, suites, and apartments at Casa de la Viuda."
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
      "category": "Luxury Hotel · Resort",
      "hotlineLabel": "Reservation hotline:",
      "hotlineAvailability": "Reservation assistance available 24 hours",
      "paragraphOne": "Since 1986, Casa de la Viuda has welcomed guests to a quiet stretch of coastline built around a single idea: a place to relax and enjoy the life. Every room and suite is designed for slow mornings and long evenings by the water.",
      "paragraphTwo": "From the poolside cabanas to the garden apartments, every stay comes with the same attention to detail our guests have returned for across four decades of hospitality.",
      "stats": {
        "rooms": "Rooms & Suites",
        "years": "Years of Hospitality",
        "rating": "Guest Rating"
      }
    },
    "featured": {
      "eyebrow": "03 — Rooms & Suites",
      "title": "Featured Stays",
      "viewAll": "View All Rooms & Suites"
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
      "title": "Rooms & Suites — Casa de la Viuda",
      "description": "Browse rooms, suites, and apartments at Casa de la Viuda."
    },
    "listing": {
      "eyebrow": "Stay With Us",
      "title": "Rooms & Suites"
    },
    "guestsUnit": "guests",
    "detail": {
      "aboutTitle": "About This Room",
      "amenitiesTitle": "Amenities",
      "requestToBook": "Request to Book",
      "checkAvailability": "Check Availability",
      "notFoundMetadataTitle": "Room not found — Casa de la Viuda"
    },
    "notFound": {
      "eyebrow": "404",
      "title": "We couldn't find that room",
      "body": "The room or suite you're looking for may have been renamed or is no longer available."
    }
  },
  "booking": {
    "metadata": {
      "title": "Request a Booking — Casa de la Viuda",
      "description": "Request a reservation at Casa de la Viuda."
    },
    "heading": {
      "eyebrow": "Request a Stay",
      "title": "Book Your Room"
    },
    "form": {
      "labels": {
        "roomSuite": "Room / Suite",
        "fullName": "Full Name",
        "email": "Email",
        "phone": "Phone",
        "guests": "Guests",
        "checkIn": "Check-in",
        "checkOut": "Check-out",
        "message": "Message (optional)"
      },
      "errors": {
        "propertySlug": "Choose a room or suite.",
        "guestName": "Enter your full name.",
        "email": "Enter a valid email.",
        "phone": "Enter a phone number.",
        "checkIn": "Choose a check-in date.",
        "checkOut": "Choose a check-out date.",
        "checkOutBeforeCheckIn": "Check-out must be after check-in.",
        "unavailableRange": "These dates include an unavailable date. Please choose another range.",
        "guestsMin": "At least 1 guest is required.",
        "guestsMax": "This room sleeps up to {count} guests."
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

- [ ] **Step 8: Create `messages/es.json`**

```json
{
  "nav": {
    "home": "Inicio",
    "properties": "Habitaciones y Suites",
    "book": "Reservar",
    "toggleMenu": "Alternar menú de navegación",
    "languageSwitcher": { "en": "EN", "es": "ES" }
  },
  "layout": {
    "title": "Casa de la Viuda",
    "description": "Un lugar para relajarse y disfrutar la vida. Reservá habitaciones, suites y apartamentos en Casa de la Viuda."
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
      "category": "Hotel de Lujo · Resort",
      "hotlineLabel": "Línea de reservas:",
      "hotlineAvailability": "Asistencia de reservas disponible las 24 horas",
      "paragraphOne": "Desde 1986, Casa de la Viuda ha recibido a sus huéspedes en un tranquilo tramo de costa construido alrededor de una sola idea: un lugar para relajarse y disfrutar la vida. Cada habitación y suite está pensada para mañanas tranquilas y largas tardes junto al mar.",
      "paragraphTwo": "Desde las cabañas junto a la piscina hasta los apartamentos con jardín, cada estadía cuenta con la misma atención al detalle por la que nuestros huéspedes han vuelto durante cuatro décadas de hospitalidad.",
      "stats": {
        "rooms": "Habitaciones y Suites",
        "years": "Años de Hospitalidad",
        "rating": "Calificación de Huéspedes"
      }
    },
    "featured": {
      "eyebrow": "03 — Habitaciones y Suites",
      "title": "Estadías Destacadas",
      "viewAll": "Ver Todas las Habitaciones y Suites"
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
      "title": "Habitaciones y Suites — Casa de la Viuda",
      "description": "Explorá habitaciones, suites y apartamentos en Casa de la Viuda."
    },
    "listing": {
      "eyebrow": "Alojate con Nosotros",
      "title": "Habitaciones y Suites"
    },
    "guestsUnit": "huéspedes",
    "detail": {
      "aboutTitle": "Sobre Esta Habitación",
      "amenitiesTitle": "Comodidades",
      "requestToBook": "Solicitar Reserva",
      "checkAvailability": "Consultar Disponibilidad",
      "notFoundMetadataTitle": "Habitación no encontrada — Casa de la Viuda"
    },
    "notFound": {
      "eyebrow": "404",
      "title": "No pudimos encontrar esa habitación",
      "body": "La habitación o suite que buscás puede haber sido renombrada o ya no está disponible."
    }
  },
  "booking": {
    "metadata": {
      "title": "Solicitar una Reserva — Casa de la Viuda",
      "description": "Solicitá una reserva en Casa de la Viuda."
    },
    "heading": {
      "eyebrow": "Solicitar una Estadía",
      "title": "Reservá Tu Habitación"
    },
    "form": {
      "labels": {
        "roomSuite": "Habitación / Suite",
        "fullName": "Nombre Completo",
        "email": "Correo Electrónico",
        "phone": "Teléfono",
        "guests": "Huéspedes",
        "checkIn": "Entrada",
        "checkOut": "Salida",
        "message": "Mensaje (opcional)"
      },
      "errors": {
        "propertySlug": "Elegí una habitación o suite.",
        "guestName": "Ingresá tu nombre completo.",
        "email": "Ingresá un correo electrónico válido.",
        "phone": "Ingresá un número de teléfono.",
        "checkIn": "Elegí una fecha de entrada.",
        "checkOut": "Elegí una fecha de salida.",
        "checkOutBeforeCheckIn": "La fecha de salida debe ser posterior a la de entrada.",
        "unavailableRange": "Estas fechas incluyen una fecha no disponible. Elegí otro rango.",
        "guestsMin": "Se requiere al menos 1 huésped.",
        "guestsMax": "Esta habitación admite hasta {count} huéspedes."
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

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully. The site is unchanged (still the old flat routes) — these new files aren't imported by anything yet.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json src/i18n/routing.ts src/i18n/navigation.ts src/i18n/request.ts src/global.d.ts next.config.ts messages/en.json messages/es.json
git commit -m "feat: install next-intl and add i18n configuration layer"
```

---

### Task 2: Restructure routing under `[locale]`, add proxy, translate page-level text

**Files:**
- Create: `src/proxy.ts`
- Move + modify: `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`
- Move + modify: `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- Move + modify: `src/app/properties/page.tsx` → `src/app/[locale]/properties/page.tsx`
- Move + modify: `src/app/properties/[slug]/page.tsx` → `src/app/[locale]/properties/[slug]/page.tsx`
- Move + modify: `src/app/properties/[slug]/not-found.tsx` → `src/app/[locale]/properties/[slug]/not-found.tsx`
- Move + modify: `src/app/booking/page.tsx` → `src/app/[locale]/booking/page.tsx`

**Interfaces:**
- Consumes: `routing`, `Link` (Task 1).
- Produces: working locale-prefixed routes for `/en` and `/es` across every page. Component-level text inside `Hero`, `AboutSection`, `BookingCta`, `FeaturedProperties`, `PropertyCard`, `Calendar`, `Gallery`, `PriceTag`, `BookingForm`, `Navbar`, `MobileMenuToggle` is **not yet translated** in this task — those components still render their current hardcoded English text. That's an expected, correct intermediate state (visiting `/es` at the end of this task shows Spanish page chrome for the 4 page files below, but English component copy) — later tasks translate each component in turn.

- [ ] **Step 1: Create `src/proxy.ts`**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: Move and replace `src/app/layout.tsx` → `src/app/[locale]/layout.tsx`**

```bash
mkdir -p src/app/\[locale\]
git mv src/app/layout.tsx "src/app/[locale]/layout.tsx"
```

Replace the moved file's content with:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, Locale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

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

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "layout" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${cormorant.variable} ${jost.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <NextIntlClientProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Move and replace `src/app/page.tsx` → `src/app/[locale]/page.tsx`**

```bash
git mv src/app/page.tsx "src/app/[locale]/page.tsx"
```

```tsx
import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { BookingCta } from "@/components/home/BookingCta";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

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

- [ ] **Step 4: Move and replace `src/app/properties/page.tsx` → `src/app/[locale]/properties/page.tsx`**

```bash
mkdir -p "src/app/[locale]/properties"
git mv src/app/properties/page.tsx "src/app/[locale]/properties/page.tsx"
```

```tsx
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProperties } from "@/services/properties";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

type PropertiesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PropertiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "properties.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PropertiesPage({ params }: PropertiesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("properties.listing");
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-14">
        <PropertyGrid properties={properties} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Move and replace `src/app/properties/[slug]/page.tsx` → `src/app/[locale]/properties/[slug]/page.tsx`**

```bash
mkdir -p "src/app/[locale]/properties/[slug]"
git mv "src/app/properties/[slug]/page.tsx" "src/app/[locale]/properties/[slug]/page.tsx"
```

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPropertyBySlug, getPropertySlugs } from "@/services/properties";
import { Gallery } from "@/components/properties/Gallery";
import { Calendar } from "@/components/properties/Calendar";
import { PriceTag } from "@/components/ui/PriceTag";

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
  const tCommon = await getTranslations("properties");
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
        {property.maxGuests} {tCommon("guestsUnit")} · {property.sizeSqm} m² ·{" "}
        {property.bedConfiguration}
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
            <PriceTag pricePerNight={property.pricePerNight} />
            <Link
              href={`/booking?property=${property.slug}`}
              className="mt-6 block bg-sage px-6 py-3 text-center text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
            >
              {t("requestToBook")}
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl text-ink">
              {t("checkAvailability")}
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

- [ ] **Step 6: Move and replace `src/app/properties/[slug]/not-found.tsx` → `src/app/[locale]/properties/[slug]/not-found.tsx`**

```bash
git mv "src/app/properties/[slug]/not-found.tsx" "src/app/[locale]/properties/[slug]/not-found.tsx"
```

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PropertyNotFound() {
  const t = await getTranslations("properties.notFound");
  const tCommon = await getTranslations("home.featured");

  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">{t("title")}</h1>
      <p className="mt-4 text-sm text-muted">{t("body")}</p>
      <Link
        href="/properties"
        className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
      >
        {tCommon("viewAll")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: Move and replace `src/app/booking/page.tsx` → `src/app/[locale]/booking/page.tsx`**

```bash
mkdir -p "src/app/[locale]/booking"
git mv src/app/booking/page.tsx "src/app/[locale]/booking/page.tsx"
```

```tsx
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProperties } from "@/services/properties";
import { BookingForm } from "@/components/booking/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

type BookingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ property?: string }>;
};

export async function generateMetadata({
  params,
}: Omit<BookingPageProps, "searchParams">): Promise<Metadata> {
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

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { property } = await searchParams;
  const t = await getTranslations("booking.heading");
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-12">
        <BookingForm properties={properties} initialPropertySlug={property} />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify empty `src/app/properties` and `src/app/booking` directories are gone**

Run: `find src/app -maxdepth 2 -type d`
Expected: only `src/app`, `src/app/[locale]`, and the nested `[locale]` subdirectories remain — no leftover empty `src/app/properties` or `src/app/booking`. If they remain (some shells leave empty dirs behind after `git mv` empties them), remove them: `rmdir src/app/properties/[slug] src/app/properties src/app/booking 2>/dev/null || true` (ignore errors if already gone).

- [ ] **Step 9: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully. Route output shows locale-prefixed routes (`/en`, `/es`, `/en/properties`, `/es/properties`, 10 total `/[locale]/properties/[slug]` static paths — 5 slugs × 2 locales, `/en/booking` and `/es/booking` dynamic).

- [ ] **Step 10: Manual verification**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000
curl -s http://localhost:3000/es | grep -o "Grandes Experiencias" || true
curl -s http://localhost:3000/es/properties | grep -o "Habitaciones y Suites"
curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "Sobre Esta Habitación"
curl -s http://localhost:3000/es/booking | grep -o "Reservá Tu Habitación"

kill "$(cat /tmp/elios-i18n-dev.pid)"
```

Expected: the root request 3xx-redirects to `/en` (or `/es`, depending on default `Accept-Language` — a bare `curl` with no header should redirect to `/en`, the `defaultLocale`); `/es/properties`, `/es/properties/deluxe-suite`, and `/es/booking` each print the expected Spanish page-chrome text. The `/es` homepage grep for "Grandes Experiencias" is expected to find **nothing** yet — `Hero` isn't translated until Task 4 — that's fine, not a failure (note it with `|| true` so the check doesn't block the script).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: restructure routes under [locale], add proxy, translate page-level chrome"
```

---

### Task 3: Language switcher, Navbar, MobileMenuToggle

**Files:**
- Create: `src/components/layout/LanguageSwitcher.tsx`
- Modify: `src/components/layout/nav-links.ts`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/MobileMenuToggle.tsx`

**Interfaces:**
- Consumes: `routing` (Task 1), `Link`/`usePathname`/`useRouter` (Task 1).
- Produces: `<LanguageSwitcher transparent?>` — the `EN | ES` toggle, rendered in both the desktop nav and the mobile dropdown.

- [ ] **Step 1: Replace `src/components/layout/nav-links.ts`**

```ts
export const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/properties", key: "properties" },
  { href: "/booking", key: "book" },
] as const;
```

- [ ] **Step 2: Create `src/components/layout/LanguageSwitcher.tsx`**

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LanguageSwitcherProps = {
  transparent?: boolean;
};

export function LanguageSwitcher({ transparent = false }: LanguageSwitcherProps) {
  const t = useTranslations("nav.languageSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(nextLocale: (typeof routing.locales)[number]) {
    if (nextLocale === activeLocale) return;
    const query = searchParams.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, {
      locale: nextLocale,
    });
  }

  return (
    <div
      className={`flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase ${
        transparent ? "text-paper" : "text-ink"
      }`}
    >
      {routing.locales.map((loc, index) => (
        <span key={loc} className="flex items-center gap-2">
          {index > 0 ? (
            <span aria-hidden className="opacity-40">
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => switchTo(loc)}
            aria-current={loc === activeLocale}
            className={loc === activeLocale ? "opacity-100" : "opacity-50 hover:opacity-100"}
          >
            {t(loc)}
          </button>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/components/layout/Navbar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MobileMenuToggle } from "./MobileMenuToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_LINKS } from "./nav-links";

const NAV_HEIGHT = "h-24";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 40);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only the homepage has a hero image behind the nav to be transparent over;
  // interior pages keep a solid nav so it never blends into plain content.
  const isTransparent = isHome && !isScrolled;
  const isBlurred = isHome && isScrolled;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-30 border-b transition-colors duration-300 ${
          isTransparent
            ? "border-transparent bg-transparent"
            : isBlurred
              ? "border-cream-line/50 bg-paper/50 backdrop-blur-md"
              : "border-cream-line bg-paper"
        }`}
      >
        <div
          className={`mx-auto flex ${NAV_HEIGHT} max-w-[1600px] items-center justify-between px-6 sm:px-10`}
        >
          <Link
            href="/"
            className={`text-xl tracking-wide ${isTransparent ? "text-paper" : "text-ink"}`}
          >
            <span className="font-semibold">CASA</span>
            <span className={isTransparent ? "font-light text-paper/70" : "font-light text-muted"}>
              {" "}
              DE LA VIUDA
            </span>
          </Link>
          <nav
            className={`hidden items-center gap-10 text-xs font-medium tracking-[0.2em] uppercase sm:flex ${
              isTransparent ? "text-paper" : "text-ink"
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-sage">
                {t(link.key)}
              </Link>
            ))}
            <LanguageSwitcher transparent={isTransparent} />
          </nav>
          <MobileMenuToggle transparent={isTransparent} />
        </div>
      </header>
      {/* Reserves the nav's height in normal flow on every page except the
          homepage, where the hero is meant to extend behind the nav instead. */}
      {!isHome ? <div aria-hidden className={NAV_HEIGHT} /> : null}
    </>
  );
}
```

- [ ] **Step 4: Replace `src/components/layout/MobileMenuToggle.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_LINKS } from "./nav-links";

type MobileMenuToggleProps = {
  transparent?: boolean;
};

export function MobileMenuToggle({ transparent = false }: MobileMenuToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("nav");

  // Once open, the dropdown itself is always solid, so the trigger lines
  // switch back to ink even in transparent mode for contrast against it.
  const lineColor = transparent && !isOpen ? "bg-paper" : "bg-ink";

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={t("toggleMenu")}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
      >
        <span className={`h-px w-5 ${lineColor}`} />
        <span className={`h-px w-5 ${lineColor}`} />
        <span className={`h-px w-5 ${lineColor}`} />
      </button>
      {isOpen ? (
        <nav className="absolute inset-x-0 top-full border-t border-cream-line bg-paper">
          <ul className="flex flex-col divide-y divide-cream-line px-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-4 text-sm tracking-[0.15em] text-ink uppercase"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
            <li className="py-4">
              <LanguageSwitcher />
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 6: Manual verification — the core feature**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s http://localhost:3000/en | grep -o "Rooms &amp; Suites" | head -1
curl -s http://localhost:3000/es | grep -o "Habitaciones y Suites" | head -1

kill "$(cat /tmp/elios-i18n-dev.pid)"
```

Expected: both greps match — the nav's "Rooms & Suites" / "Habitaciones y Suites" link text renders correctly per locale. (Full interactive switcher behavior — click-driven path/query preservation — is browser-only; verify manually in a browser if available, clicking `ES` on `/en/booking?property=deluxe-suite` and confirming it lands on `/es/booking?property=deluxe-suite`, not `/es/booking` or `/es`.)

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/LanguageSwitcher.tsx src/components/layout/nav-links.ts src/components/layout/Navbar.tsx src/components/layout/MobileMenuToggle.tsx
git commit -m "feat: add language switcher and translate Navbar/MobileMenuToggle"
```

---

### Task 4: Translate homepage components

**Files:**
- Modify: `src/components/home/Hero.tsx`
- Modify: `src/components/home/AboutSection.tsx`
- Modify: `src/components/home/BookingCta.tsx`
- Modify: `src/components/home/FeaturedProperties.tsx`

**Interfaces:**
- Consumes: `messages.home.*` (Task 1), `Link` (Task 1).
- Produces: fully translated homepage (pending `PropertyCard`'s own translation in Task 5 — `FeaturedProperties` renders `PropertyCard`, whose "guests" unit word stays English until then; that's expected).

- [ ] **Step 1: Replace `src/components/home/Hero.tsx`**

```tsx
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative h-[80vh] w-full sm:h-auto sm:aspect-[16/7.36]">
      <Image
        src="/images/hero-coastline.jpg"
        alt={t("imageAlt")}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/10 to-ink/40" />

      <div className="absolute inset-x-6 bottom-14 text-paper sm:right-10 sm:left-auto sm:max-w-xl sm:text-right">
        <p className="mb-4 text-xs tracking-[0.3em] uppercase">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl leading-[1.1] font-normal sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-xs tracking-[0.3em] uppercase">{t("subtitle")}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace `src/components/home/AboutSection.tsx`**

```tsx
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("home.about");

  const stats = [
    { label: t("stats.rooms"), value: "10" },
    { label: t("stats.years"), value: "40" },
    { label: t("stats.rating"), value: "4.9" },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-10">
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-4 font-display text-[15vw] leading-none font-normal text-cream italic select-none sm:text-[7rem]"
      >
        {t("since")}
      </p>

      <div className="relative">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          {t("eyebrow")}
        </p>

        <div className="mx-auto mt-14 grid max-w-6xl gap-12 text-left sm:grid-cols-[1fr_1.4fr_1.4fr]">
          <div>
            <div className="flex h-14 w-14 items-center justify-center border border-ink font-display text-2xl">
              V
            </div>
            <p className="mt-5 text-sm font-semibold tracking-[0.1em]">
              CASA DE LA VIUDA — RESORT
            </p>
            <p className="mt-2 text-xs text-muted">
              {t("category")} &nbsp; ★★★★★
            </p>
            <p className="mt-6 text-sm text-ink/70">
              {t("hotlineLabel")} <span className="text-sage">+05465 183888</span>
            </p>
            <p className="mt-1 text-sm text-ink/70">{t("hotlineAvailability")}</p>
          </div>

          <p className="text-sm leading-8 text-ink/70">{t("paragraphOne")}</p>

          <p className="text-sm leading-8 text-ink/70">{t("paragraphTwo")}</p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-cream-line pt-10">
          {stats.map((stat) => (
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

- [ ] **Step 3: Replace `src/components/home/BookingCta.tsx`**

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function BookingCta() {
  const t = useTranslations("home.cta");

  return (
    <section className="bg-ink px-6 py-20 text-center text-paper sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium sm:text-4xl">
        {t("title")}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-paper/70">{t("body")}</p>
      <Link
        href="/booking"
        className="mt-10 inline-block bg-sage px-10 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
      >
        {t("button")}
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Replace `src/components/home/FeaturedProperties.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProperties } from "@/services/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";

export async function FeaturedProperties() {
  const t = await getTranslations("home.featured");
  const properties = await getProperties();
  const featured = properties.slice(0, 3);

  return (
    <section className="bg-cream px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
          {t("title")}
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
            {t("viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 6: Manual verification**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s http://localhost:3000/es | grep -o "Grandes Experiencias en Casa de la Viuda"
curl -s http://localhost:3000/es | grep -o "Desde 1986"
curl -s http://localhost:3000/es | grep -o "Estadías Destacadas"
curl -s http://localhost:3000/en | grep -o "Great Experiences at Casa de la Viuda"

kill "$(cat /tmp/elios-i18n-dev.pid)"
```

Expected: all four greps match.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/Hero.tsx src/components/home/AboutSection.tsx src/components/home/BookingCta.tsx src/components/home/FeaturedProperties.tsx
git commit -m "feat: translate homepage components"
```

---

### Task 5: Locale-aware formatting, PriceTag, Calendar, Gallery, PropertyCard

**Files:**
- Modify: `src/lib/dates.ts`
- Modify: `src/components/ui/PriceTag.tsx`
- Modify: `src/components/properties/Calendar.tsx`
- Modify: `src/components/properties/Gallery.tsx`
- Modify: `src/components/properties/PropertyCard.tsx`

**Interfaces:**
- Consumes: `messages.priceTag.*`, `messages.calendar.*`, `messages.gallery.*`, `messages.properties.guestsUnit` (Task 1), `Link` (Task 1).
- Produces: `toIntlLocale(locale: string): string` — new export from `@/lib/dates`, used wherever a next-intl locale code (`"en"`/`"es"`) needs to become an `Intl`-formatting locale tag (`"en-US"`/`"es-UY"`). `formatPrice`/`formatDateLong` now take that `Intl` tag as a second parameter (previously hardcoded to `"en-US"`).

- [ ] **Step 1: Modify `src/lib/dates.ts` — add `toIntlLocale` and parameterize `formatDateLong`/`formatPrice`**

Change the `formatDateLong` function from:

```ts
export function formatDateLong(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
```

to:

```ts
export function toIntlLocale(locale: string): string {
  return locale === "es" ? "es-UY" : "en-US";
}

export function formatDateLong(dateISO: string, intlLocale = "en-US"): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  return new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
```

Change `formatPrice` from:

```ts
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

to:

```ts
export function formatPrice(amount: number, intlLocale = "en-US"): string {
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
```

Both new parameters default to `"en-US"` so any caller not yet updated keeps working exactly as before — but every caller in this task passes `toIntlLocale(locale)` explicitly.

- [ ] **Step 2: Replace `src/components/ui/PriceTag.tsx`**

```tsx
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, toIntlLocale } from "@/lib/dates";

type PriceTagProps = {
  pricePerNight: number;
};

export function PriceTag({ pricePerNight }: PriceTagProps) {
  const locale = useLocale();
  const t = useTranslations("priceTag");

  return (
    <p className="text-ink">
      <span className="font-display text-2xl font-medium">
        {formatPrice(pricePerNight, toIntlLocale(locale))}
      </span>
      <span className="ml-1 text-xs tracking-[0.15em] text-muted uppercase">
        {t("perNight")}
      </span>
    </p>
  );
}
```

- [ ] **Step 3: Replace `src/components/properties/Calendar.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildMonthGrid, toIntlLocale, toISODate } from "@/lib/dates";

type CalendarProps = {
  unavailableDates: string[];
  selectedRange?: { checkIn: string | null; checkOut: string | null };
  onSelectDate?: (dateISO: string) => void;
};

// Built as a standalone, reusable component so the future /admin/calendar page can reuse it.
export function Calendar({
  unavailableDates,
  selectedRange,
  onSelectDate,
}: CalendarProps) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const weekdayLabels = t.raw("weekdays") as string[];

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

  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString(
    intlLocale,
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );

  return (
    <div className="border border-cream-line p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label={t("previousMonth")}
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
          aria-label={t("nextMonth")}
          className="text-sm text-muted hover:text-ink"
        >
          ›
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {weekdayLabels.map((label, index) => (
          <span key={index}>{label}</span>
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
          <span className="h-2.5 w-2.5 bg-cream-line" /> {t("unavailable")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-sage" /> {t("selected")}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/components/properties/Gallery.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

type GalleryProps = {
  images: string[];
};

export function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useTranslations("gallery");

  if (images.length === 0) {
    return (
      <PhotoPlaceholder label={t("noPhotos")} className="aspect-[16/10] w-full" />
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
              aria-label={t("showPhoto", { label: image })}
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

- [ ] **Step 5: Replace `src/components/properties/PropertyCard.tsx`**

```tsx
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  const t = useTranslations("properties");

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
          {property.maxGuests} {t("guestsUnit")} · {property.sizeSqm} m² ·{" "}
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

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 7: Manual verification**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "/ noche"
curl -s http://localhost:3000/en/properties/deluxe-suite | grep -o "/ night"
curl -s http://localhost:3000/es | grep -o "huéspedes" | head -1
curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "No disponible"
curl -s http://localhost:3000/en/properties/deluxe-suite | grep -o "Unavailable"

kill "$(cat /tmp/elios-i18n-dev.pid)"
```

Expected: all five greps match.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dates.ts src/components/ui/PriceTag.tsx src/components/properties/Calendar.tsx src/components/properties/Gallery.tsx src/components/properties/PropertyCard.tsx
git commit -m "feat: translate PriceTag/Calendar/Gallery/PropertyCard, add locale-aware formatting"
```

---

### Task 6: Translate BookingForm

**Files:**
- Modify: `src/components/booking/BookingForm.tsx`

**Interfaces:**
- Consumes: `messages.booking.form.*`, `messages.booking.confirmation.*` (Task 1).
- Produces: fully translated booking form — labels, validation errors (including the interpolated `{count}` in the max-guests error), submit button states, and the confirmation panel (including the interpolated `{name}`).

- [ ] **Step 1: Replace `src/components/booking/BookingForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createReservationRequest } from "@/services/reservations";
import { rangeIncludesUnavailable } from "@/lib/dates";
import type { Property } from "@/types/property";
import type { ReservationRequest } from "@/types/reservation";

type BookingFormProps = {
  properties: Property[];
  initialPropertySlug?: string;
};

type FormErrors = Partial<Record<keyof ReservationRequest, string>>;

export function BookingForm({ properties, initialPropertySlug }: BookingFormProps) {
  const t = useTranslations("booking.form");
  const tConfirmation = useTranslations("booking.confirmation");

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
    if (!form.propertySlug) nextErrors.propertySlug = t("errors.propertySlug");
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
      selectedProperty &&
      rangeIncludesUnavailable(
        form.checkIn,
        form.checkOut,
        selectedProperty.unavailableDates
      )
    ) {
      nextErrors.checkIn = t("errors.unavailableRange");
    }
    if (form.guests < 1) {
      nextErrors.guests = t("errors.guestsMin");
    } else if (selectedProperty && form.guests > selectedProperty.maxGuests) {
      nextErrors.guests = t("errors.guestsMax", {
        count: selectedProperty.maxGuests,
      });
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
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.roomSuite")}
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

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully.

- [ ] **Step 3: Manual verification**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

curl -s http://localhost:3000/es/booking | grep -o "Habitación / Suite"
curl -s http://localhost:3000/es/booking | grep -o "Nombre Completo"
curl -s http://localhost:3000/es/booking | grep -o "Enviar Solicitud de Reserva"
curl -s http://localhost:3000/en/booking | grep -o "Send Booking Request"

kill "$(cat /tmp/elios-i18n-dev.pid)"
```

Expected: all four greps match. (Validation-error and confirmation-panel text only render after form interaction — verify those manually in a browser if available: submit the empty form on `/es/booking` and confirm Spanish error messages appear; fill it out and submit, confirming the Spanish "Gracias, {name}." confirmation panel with the reference ID.)

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/BookingForm.tsx
git commit -m "feat: translate BookingForm labels, validation, and confirmation"
```

---

### Task 7: Final integration verification

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors (any warnings must be scoped to `.claude/**`, not `src/**` — matches the project's existing ESLint ignore convention).

- [ ] **Step 2: Full type check and production build**

Run: `npx tsc --noEmit && npm run build`
Expected: build completes successfully. Route table shows `/[locale]`, `/[locale]/properties`, `/[locale]/properties/[slug]` (10 static paths — 5 slugs × 2 locales), `/[locale]/booking` (dynamic), for both `en` and `es`.

- [ ] **Step 3: Comprehensive manual dev-server pass**

```bash
npm run dev &
echo $! > /tmp/elios-i18n-final.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'

echo "-- root redirects to default locale --"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -sI http://localhost:3000 | grep -i "^location:"

echo "-- Spanish renders on every route --"
curl -s http://localhost:3000/es | grep -o "Grandes Experiencias en Casa de la Viuda"
curl -s http://localhost:3000/es/properties | grep -o "Habitaciones y Suites" | head -1
curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "Sobre Esta Habitación"
curl -s http://localhost:3000/es/properties/does-not-exist | grep -o "No pudimos encontrar"
curl -s http://localhost:3000/es/booking | grep -o "Reservá Tu Habitación"

echo "-- English renders on every route --"
curl -s http://localhost:3000/en | grep -o "Great Experiences at Casa de la Viuda"
curl -s http://localhost:3000/en/properties | grep -o "Rooms &amp; Suites" | head -1
curl -s http://localhost:3000/en/properties/deluxe-suite | grep -o "About This Room"
curl -s http://localhost:3000/en/properties/does-not-exist | grep -o "We couldn"
curl -s http://localhost:3000/en/booking | grep -o "Book Your Room"

echo "-- room catalog content stays English in both locales (scope decision) --"
curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "Deluxe Suite"
curl -s http://localhost:3000/es/properties/deluxe-suite | grep -o "sea-facing suite" || echo "(description not found — check src/data/properties.ts wasn't touched)"

echo "-- footer stays unlocalized in both locales (scope decision) --"
curl -s http://localhost:3000/es | grep -o "Punta del Diablo"
curl -s http://localhost:3000/en | grep -o "Punta del Diablo"

kill "$(cat /tmp/elios-i18n-final.pid)"
```

Expected: every grep above prints a match (the root redirect's `Location` header points to `/en`); room catalog content (room name, description) is identical between `/en` and `/es`; the footer's "Punta del Diablo" address renders unchanged on both locales.

- [ ] **Step 4: Browser walkthrough (if a browser tool is available in your environment)**

Drive the language-switcher-specific path: navigate to `/en/properties/deluxe-suite` → click "Request to Book" → confirm you land on `/en/booking?property=deluxe-suite` → click `ES` in the nav → confirm the URL becomes `/es/booking?property=deluxe-suite` (same page, same query string, room still pre-selected in the now-Spanish-labeled dropdown) and the `ES` label is now visually the active one. Then click `EN` and confirm it returns to `/en/booking?property=deluxe-suite`.

If no browser automation tool is available, note that in your final report — the `curl` checks in Step 3 remain the source of truth for page-level content; the switcher's client-side query-preservation behavior specifically needs either a browser or a manual check by the user.

- [ ] **Step 5: Final commit (only if any stragglers remain)**

```bash
git status
# If everything from Tasks 1-6 was already committed, there is nothing to do here.
# Otherwise, stage and commit any remaining changes with a descriptive message.
```
