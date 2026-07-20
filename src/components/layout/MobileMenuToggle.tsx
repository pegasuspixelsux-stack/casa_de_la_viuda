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
