import Link from "next/link";

export function BookingCta() {
  return (
    <section className="bg-ink px-6 py-20 text-center text-paper sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        04 — Ready When You Are
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium sm:text-4xl">
        Request Your Stay at Casa de la Viuda
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-paper/70">
        Tell us your dates and party size — our team confirms every request
        within 24 hours.
      </p>
      <Link
        href="/booking"
        className="mt-10 inline-block bg-sage px-10 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
      >
        Start Booking Request
      </Link>
    </section>
  );
}
