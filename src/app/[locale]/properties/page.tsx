import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProperties } from "@/services/properties";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

type PropertiesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PropertiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "properties.metadata",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PropertiesPage({ params }: PropertiesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("properties.listing");
  const properties = await getProperties();

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-14">
        <PropertyGrid properties={properties} />
      </div>
    </div>
  );
}
