import type { Metadata } from "next";
import { getProperties } from "@/services/properties";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Rooms & Suites — Casa de la Viuda",
  description: "Browse rooms, suites, and apartments at Casa de la Viuda.",
};

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow="Stay With Us" title="Rooms & Suites" />
      <div className="mt-14">
        <PropertyGrid properties={properties} />
      </div>
    </div>
  );
}
