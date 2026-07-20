import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function BookingCta() {
  const t = useTranslations("home.cta");

  return (
    <section className="bg-ink px-6 py-20 text-center text-paper sm:px-10">
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium sm:text-4xl">
        {t("title")}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-paper/70">{t("body")}</p>
      <Link
        href="/booking"
        className="mt-10 inline-block bg-sage px-10 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark"
      >
        {t("button")}
      </Link>
    </section>
  );
}
