import Image from "next/image";
import Link from "next/link";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { PriceTag } from "@/components/ui/PriceTag";
import type { Property } from "@/types/property";

type PropertyCardProps = {
  property: Property;
};

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      {property.cardImage ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={property.cardImage}
            alt={property.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <PhotoPlaceholder
          label={property.images[0] ?? property.name}
          className="aspect-[4/3] w-full"
        />
      )}
      <div className="mt-4">
        <p className="text-xs tracking-[0.15em] text-sage uppercase">
          {property.category}
        </p>
        <h3 className="mt-1 font-display text-xl text-ink group-hover:text-sage">
          {property.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {property.maxGuests} guests · {property.sizeSqm} m² ·{" "}
          {property.bedConfiguration}
        </p>
        <div className="mt-3">
          <PriceTag pricePerNight={property.pricePerNight} />
        </div>
      </div>
    </Link>
  );
}
