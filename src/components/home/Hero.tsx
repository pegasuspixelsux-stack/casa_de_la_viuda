import Image from "next/image";

export function Hero() {
  return (
    <section className="relative h-[80vh] w-full sm:h-auto sm:aspect-[16/7.36]">
      <Image
        src="/images/hero-coastline.jpg"
        alt="The rocky coastline and lighthouse by Casa de la Viuda"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-ink/10 to-ink/40" />

      <div className="absolute inset-x-6 bottom-14 text-paper sm:right-10 sm:left-auto sm:max-w-xl sm:text-right">
        <p className="mb-4 text-xs tracking-[0.3em] uppercase">
          01 — Welcome to Casa de la Viuda
        </p>
        <h1 className="font-display text-4xl leading-[1.1] font-normal sm:text-6xl">
          Great Experiences at Casa de la Viuda
        </h1>
        <p className="mt-5 text-xs tracking-[0.3em] uppercase">
          A place to relax and enjoy the life
        </p>
      </div>
    </section>
  );
}
