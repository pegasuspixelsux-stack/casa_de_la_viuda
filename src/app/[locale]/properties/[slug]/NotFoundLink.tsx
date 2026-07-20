"use client";

// Deliberately uses next/link + next/navigation instead of @/i18n/navigation: not-found.js
// files get no `params`, and any next-intl call here would force [slug] into dynamic
// rendering, defeating generateStaticParams. Only place in the codebase this applies.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function NotFoundLink() {
  const pathname = usePathname();
  const [, maybeLocale] = pathname.split("/");
  const locale = routing.locales.includes(
    maybeLocale as (typeof routing.locales)[number]
  )
    ? maybeLocale
    : routing.defaultLocale;

  return (
    <Link
      href={`/${locale}/properties`}
      className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
    >
      View All Rooms & Suites
    </Link>
  );
}
