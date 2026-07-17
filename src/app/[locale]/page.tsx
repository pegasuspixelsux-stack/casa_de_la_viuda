import { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { BookingCta } from "@/components/home/BookingCta";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <>
      <Hero />
      <AboutSection />
      <FeaturedProperties />
      <BookingCta />
    </>
  );
}
