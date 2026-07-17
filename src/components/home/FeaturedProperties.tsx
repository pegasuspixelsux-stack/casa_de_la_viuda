import Link from "next/link";
import { getProperties } from "@/services/properties";
import { PropertyCard } from "@/components/properties/PropertyCard";

export async function FeaturedProperties() {
  const properties = await getProperties();
  const featured = properties.slice(0, 3);

  return (
    <section className="bg-cream px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          03 — Rooms & Suites
        </p>
        <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
          Featured Stays
        </h2>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.slug} property={property} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/properties"
            className="border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
          >
            View All Rooms & Suites
          </Link>
        </div>
      </div>
    </section>
  );
}
