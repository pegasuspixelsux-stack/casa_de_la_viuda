import type { Metadata } from "next";
import { getProperties } from "@/services/properties";
import { BookingForm } from "@/components/booking/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Request a Booking — Eskor Hotel",
  description: "Request a reservation at Eskor Hotel.",
};

type BookingPageProps = {
  searchParams: Promise<{ property?: string }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const { property } = await searchParams;
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow="Request a Stay" title="Book Your Room" />
      <div className="mt-12">
        <BookingForm properties={properties} initialPropertySlug={property} />
      </div>
    </div>
  );
}
