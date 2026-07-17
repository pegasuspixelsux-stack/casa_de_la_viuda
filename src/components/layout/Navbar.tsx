"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMenuToggle } from "./MobileMenuToggle";
import { NAV_LINKS } from "./nav-links";

const NAV_HEIGHT = "h-24";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

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
            <span className="font-semibold">ESKOR</span>
            <span className={isTransparent ? "font-light text-paper/70" : "font-light text-muted"}>
              HOTEL
            </span>
          </Link>
          <nav
            className={`hidden gap-10 text-xs font-medium tracking-[0.2em] uppercase sm:flex ${
              isTransparent ? "text-paper" : "text-ink"
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-sage">
                {link.label}
              </Link>
            ))}
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
