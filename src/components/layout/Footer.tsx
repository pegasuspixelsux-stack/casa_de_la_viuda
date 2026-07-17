const CONTACT_ITEMS = [
  "Casa de la Viuda",
  "Box 16522 Viuda Street, Körle 6007, Germany",
  "+(041) 3454 7890",
  "info@casadelaviuda.com",
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink py-10 text-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-6 text-center text-xs tracking-[0.15em] uppercase sm:flex-row sm:justify-center sm:gap-6 sm:px-10">
        {CONTACT_ITEMS.map((item, index) => (
          <span key={item} className="flex items-center gap-6">
            {item}
            {index < CONTACT_ITEMS.length - 1 ? (
              <span className="hidden opacity-40 sm:inline">|</span>
            ) : null}
          </span>
        ))}
      </div>
    </footer>
  );
}
