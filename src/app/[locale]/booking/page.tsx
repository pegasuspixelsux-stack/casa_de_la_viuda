import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getHome } from "@/services/home";
import { BookingForm } from "@/components/booking/BookingForm";
import { Calendar } from "@/components/properties/Calendar";
import { PriceTag } from "@/components/ui/PriceTag";
import { SectionHeading } from "@/components/ui/SectionHeading";

type BookingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "booking.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("booking.heading");
  const tProperties = await getTranslations("properties.detail");
  const home = await getHome();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

      <div className="mt-12 border border-cream-line p-6">
        <PriceTag pricePerNight={home.pricePerNight} />
        <p className="mt-4 text-sm leading-7 text-ink/70">{home.description}</p>

        <h2 className="mt-8 font-display text-xl text-ink">
          {tProperties("amenitiesTitle")}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
          {home.amenities.map((amenity) => (
            <li key={amenity} className="flex items-center gap-2">
              <span className="h-1 w-1 bg-sage" />
              {amenity}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Calendar unavailableDates={home.unavailableDates} />
        </div>
      </div>

      <div className="mt-12">
        <BookingForm home={home} />
      </div>
    </div>
  );
}
