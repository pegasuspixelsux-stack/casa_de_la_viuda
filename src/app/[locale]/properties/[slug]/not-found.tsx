import { NotFoundLink } from "./NotFoundLink";

// Hardcoded English-only (no next-intl) for the same reason as NotFoundLink: any next-intl
// usage in a not-found.js boundary forces /[locale]/properties/[slug] dynamic. The <title>
// from page.tsx's generateMetadata is still localized, so title/body language can mismatch
// here on purpose — accepted tradeoff, not a bug.
export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">
        We couldn&apos;t find that space
      </h1>
      <p className="mt-4 text-sm text-muted">
        The space you&apos;re looking for may have been renamed or is no
        longer part of the home.
      </p>
      <NotFoundLink />
    </div>
  );
}
