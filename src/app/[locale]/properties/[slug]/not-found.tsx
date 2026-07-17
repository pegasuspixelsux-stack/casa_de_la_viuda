import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function PropertyNotFound() {
  const t = await getTranslations("properties.notFound");
  const tCommon = await getTranslations("home.featured");

  return (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 font-display text-3xl text-ink">{t("title")}</h1>
      <p className="mt-4 text-sm text-muted">{t("body")}</p>
      <Link
        href="/properties"
        className="mt-8 inline-block border border-ink px-8 py-3 text-xs font-medium tracking-[0.2em] text-ink uppercase hover:bg-ink hover:text-paper"
      >
        {tCommon("viewAll")}
      </Link>
    </div>
  );
}
