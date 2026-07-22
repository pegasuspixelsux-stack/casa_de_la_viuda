import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("home.about");

  const stats = [
    { label: t("stats.rooms"), value: "5" },
    { label: t("stats.years"), value: "40" },
    { label: t("stats.rating"), value: "4.9" },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-24 text-center sm:px-10">
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-4 font-display text-[15vw] leading-none font-normal text-cream italic select-none sm:text-[7rem]"
      >
        {t("since")}
      </p>

      <div className="relative">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          {t("eyebrow")}
        </p>

        <div className="mx-auto mt-14 grid max-w-6xl gap-12 text-left sm:grid-cols-[1fr_1.4fr_1.4fr]">
          <div>
            <div className="flex h-14 w-14 items-center justify-center border border-ink font-display text-2xl">
              V
            </div>
            <p className="mt-5 text-sm font-semibold tracking-[0.1em]">
              CASA DE LA VIUDA
            </p>
            <p className="mt-2 text-xs text-muted">
              {t("category")} &nbsp; ★★★★★
            </p>
            <p className="mt-6 text-sm text-ink/70">
              {t("hotlineLabel")} <span className="text-sage">+05465 183888</span>
            </p>
            <p className="mt-1 text-sm text-ink/70">{t("hotlineAvailability")}</p>
          </div>

          <p className="text-sm leading-8 text-ink/70">{t("paragraphOne")}</p>

          <p className="text-sm leading-8 text-ink/70">{t("paragraphTwo")}</p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8 border-t border-cream-line pt-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="font-display text-3xl text-ink">{stat.value}</dt>
              <dd className="mt-2 text-xs tracking-[0.15em] text-muted uppercase">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
