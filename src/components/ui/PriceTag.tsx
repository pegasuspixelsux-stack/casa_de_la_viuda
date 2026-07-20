import { useLocale, useTranslations } from "next-intl";
import { formatPrice, toIntlLocale } from "@/lib/dates";

type PriceTagProps = {
  pricePerNight: number;
};

export function PriceTag({ pricePerNight }: PriceTagProps) {
  const locale = useLocale();
  const t = useTranslations("priceTag");

  return (
    <p className="text-ink">
      <span className="font-display text-2xl font-medium">
        {formatPrice(pricePerNight, toIntlLocale(locale))}
      </span>
      <span className="ml-1 text-xs tracking-[0.15em] text-muted uppercase">
        {t("perNight")}
      </span>
    </p>
  );
}
