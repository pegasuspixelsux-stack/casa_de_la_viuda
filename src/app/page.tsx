import { Hero } from "@/components/home/Hero";
import { AboutSection } from "@/components/home/AboutSection";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { BookingCta } from "@/components/home/BookingCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <FeaturedProperties />
      <BookingCta />
    </>
  );
}
