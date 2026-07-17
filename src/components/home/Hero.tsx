import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

export function Hero() {
  return (
    <section className="relative aspect-[16/11] w-full sm:aspect-[16/9.2]">
      <PhotoPlaceholder
        label="Pool and hotel hero photograph"
        variant="dark"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/10 to-ink/40" />

      <div className="absolute inset-x-6 top-10 flex justify-end sm:inset-x-10">
        <Link
          href="/booking"
          className="bg-sage px-6 py-3 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
        >
          Book
        </Link>
      </div>

      <div className="absolute inset-x-6 bottom-14 text-paper sm:right-10 sm:left-auto sm:max-w-xl sm:text-right">
        <p className="mb-4 text-xs tracking-[0.3em] uppercase">
          01 — Welcome to Eskor Hotel
        </p>
        <h1 className="font-display text-4xl leading-[1.1] font-normal sm:text-6xl">
          Great Experiences at the Eskor Hotel
        </h1>
        <p className="mt-5 text-xs tracking-[0.3em] uppercase">
          A place to relax and enjoy the life
        </p>
      </div>
    </section>
  );
}
