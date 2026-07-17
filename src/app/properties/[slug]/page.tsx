import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPropertyBySlug, getPropertySlugs } from "@/services/properties";
import { Gallery } from "@/components/properties/Gallery";
import { Calendar } from "@/components/properties/Calendar";
import { PriceTag } from "@/components/ui/PriceTag";

type PropertyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getPropertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Room not found — Eskor Hotel" };
  return {
    title: `${property.name} — Eskor Hotel`,
    description: property.shortDescription,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {property.category}
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">{property.name}</h1>
      <p className="mt-3 text-sm text-muted">
        {property.maxGuests} guests · {property.sizeSqm} m² ·{" "}
        {property.bedConfiguration}
      </p>

      <div className="mt-10">
        <Gallery images={property.images} />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl text-ink">About This Room</h2>
          <p className="mt-4 text-sm leading-8 text-ink/70">
            {property.description}
          </p>

          <h2 className="mt-10 font-display text-2xl text-ink">Amenities</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
            {property.amenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-2">
                <span className="h-1 w-1 bg-sage" />
                {amenity}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="border border-cream-line p-6">
            <PriceTag pricePerNight={property.pricePerNight} />
            <Link
              href={`/booking?property=${property.slug}`}
              className="mt-6 block bg-sage px-6 py-3 text-center text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
            >
              Request to Book
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl text-ink">
              Check Availability
            </h2>
            <div className="mt-4">
              <Calendar unavailableDates={property.unavailableDates} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
