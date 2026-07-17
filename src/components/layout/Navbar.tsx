import Link from "next/link";
import { MobileMenuToggle } from "./MobileMenuToggle";
import { NAV_LINKS } from "./nav-links";

export function Navbar() {
  return (
    <header className="relative z-20 border-b border-cream-line bg-paper">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="text-xl tracking-wide">
          <span className="font-semibold">ESKOR</span>
          <span className="font-light text-muted">HOTEL</span>
        </Link>
        <nav className="hidden gap-10 text-xs font-medium tracking-[0.2em] text-ink uppercase sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-sage">
              {link.label}
            </Link>
          ))}
        </nav>
        <MobileMenuToggle />
      </div>
    </header>
  );
}
