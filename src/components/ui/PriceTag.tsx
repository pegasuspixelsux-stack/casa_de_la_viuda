import { formatPrice } from "@/lib/dates";

type PriceTagProps = {
  pricePerNight: number;
};

export function PriceTag({ pricePerNight }: PriceTagProps) {
  return (
    <p className="text-ink">
      <span className="font-display text-2xl font-medium">
        {formatPrice(pricePerNight)}
      </span>
      <span className="ml-1 text-xs tracking-[0.15em] text-muted uppercase">
        / night
      </span>
    </p>
  );
}
