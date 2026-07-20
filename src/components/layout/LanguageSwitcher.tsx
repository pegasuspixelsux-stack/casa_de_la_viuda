"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type LanguageSwitcherProps = {
  transparent?: boolean;
};

// Split into Suspense/Content/Fallback because useSearchParams() (needed to preserve the
// query string across a locale switch) requires a Suspense boundary, and this renders
// inside the always-visible Navbar/MobileMenuToggle — without it, prod build fails.
// Fallback is a non-interactive visual twin (useLocale() only) so the fixed Navbar
// doesn't shift while Content hydrates.
export function LanguageSwitcher(props: LanguageSwitcherProps) {
  return (
    <Suspense fallback={<LanguageSwitcherFallback {...props} />}>
      <LanguageSwitcherContent {...props} />
    </Suspense>
  );
}

function localeLabelClass(isActive: boolean) {
  return isActive ? "opacity-100" : "opacity-50 hover:opacity-100";
}

function LanguageSwitcherFallback({ transparent = false }: LanguageSwitcherProps) {
  const t = useTranslations("nav.languageSwitcher");
  const activeLocale = useLocale();

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
          <span className={localeLabelClass(loc === activeLocale)}>{t(loc)}</span>
        </span>
      ))}
    </div>
  );
}

function LanguageSwitcherContent({ transparent = false }: LanguageSwitcherProps) {
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
            className={localeLabelClass(loc === activeLocale)}
          >
            {t(loc)}
          </button>
        </span>
      ))}
    </div>
  );
}
