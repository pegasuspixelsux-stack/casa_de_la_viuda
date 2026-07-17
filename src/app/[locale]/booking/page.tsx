import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProperties } from "@/services/properties";
import { BookingForm } from "@/components/booking/BookingForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

type BookingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ property?: string }>;
};

export async function generateMetadata({
  params,
}: Omit<BookingPageProps, "searchParams">): Promise<Metadata> {
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

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const { property } = await searchParams;
  const t = await getTranslations("booking.heading");
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-12">
        <BookingForm properties={properties} initialPropertySlug={property} />
      </div>
    </div>
  );
}
