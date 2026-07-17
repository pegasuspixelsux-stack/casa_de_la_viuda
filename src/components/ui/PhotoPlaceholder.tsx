type PhotoPlaceholderProps = {
  label: string;
  className?: string;
  variant?: "light" | "dark";
};

export function PhotoPlaceholder({
  label,
  className = "",
  variant = "light",
}: PhotoPlaceholderProps) {
  const tone =
    variant === "dark"
      ? "from-ink/80 to-ink/40 text-paper/70"
      : "from-cream to-cream-line text-muted";

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${tone} ${className}`}
    >
      <span className="px-4 text-center text-xs font-medium tracking-[0.2em] uppercase">
        {label}
      </span>
    </div>
  );
}
