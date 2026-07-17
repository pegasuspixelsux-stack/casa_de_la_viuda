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
