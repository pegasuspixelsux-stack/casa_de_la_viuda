export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateISO: string, days: number): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function formatDateLong(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type CalendarDay = {
  dateISO: string;
  day: number;
  isCurrentMonth: boolean;
  isPast: boolean;
};

/** Builds a 6-row x 7-col grid (including leading/trailing days from
 * neighboring months) for the given year/month (0-indexed month). */
export function buildMonthGrid(
  year: number,
  month: number,
  todayISO: string
): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - startWeekday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + i);
    const dateISO = toISODate(current);
    days.push({
      dateISO,
      day: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === month,
      isPast: dateISO < todayISO,
    });
  }
  return days;
}

export function isDateUnavailable(
  dateISO: string,
  unavailableDates: string[]
): boolean {
  return unavailableDates.includes(dateISO);
}

export function rangeIncludesUnavailable(
  checkIn: string,
  checkOut: string,
  unavailableDates: string[]
): boolean {
  if (!checkIn || !checkOut) return false;
  let cursor = checkIn;
  while (cursor < checkOut) {
    if (unavailableDates.includes(cursor)) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}
