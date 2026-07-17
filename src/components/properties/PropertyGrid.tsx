import { PropertyCard } from "@/components/properties/PropertyCard";
import type { Property } from "@/types/property";

type PropertyGridProps = {
  properties: Property[];
};

export function PropertyGrid({ properties }: PropertyGridProps) {
  return (
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.slug} property={property} />
      ))}
    </div>
  );
}
