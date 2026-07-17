type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl font-medium text-ink sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
