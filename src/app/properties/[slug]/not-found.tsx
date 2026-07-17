import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">
        We couldn&apos;t find that room
      </h1>
      <p className="mt-4 text-sm text-muted">
        The room or suite you&apos;re looking for may have been renamed or is
        no longer available.
      </p>
      <Link
        href="/properties"
        className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
      >
        View All Rooms & Suites
      </Link>
    </div>
  );
}
