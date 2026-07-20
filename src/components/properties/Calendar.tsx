"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { buildMonthGrid, toIntlLocale, toISODate } from "@/lib/dates";

type CalendarProps = {
  unavailableDates: string[];
  selectedRange?: { checkIn: string | null; checkOut: string | null };
  onSelectDate?: (dateISO: string) => void;
};

// Built as a standalone, reusable component so the future /admin/calendar page can reuse it.
export function Calendar({
  unavailableDates,
  selectedRange,
  onSelectDate,
}: CalendarProps) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const weekdayLabels = t.raw("weekdays") as string[];

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayISO = toISODate(today);
  const days = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, todayISO),
    [viewYear, viewMonth, todayISO]
  );

  function goToPreviousMonth() {
    setViewMonth((month) => {
      if (month === 0) {
        setViewYear((year) => year - 1);
        return 11;
      }
      return month - 1;
    });
  }

  function goToNextMonth() {
    setViewMonth((month) => {
      if (month === 11) {
        setViewYear((year) => year + 1);
        return 0;
      }
      return month + 1;
    });
  }

  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString(
    intlLocale,
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  );

  return (
    <div className="border border-cream-line p-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label={t("previousMonth")}
          className="text-sm text-muted hover:text-ink"
        >
          ‹
        </button>
        <p className="text-xs font-medium tracking-[0.2em] text-ink uppercase">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label={t("nextMonth")}
          className="text-sm text-muted hover:text-ink"
        >
          ›
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {weekdayLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isUnavailable = unavailableDates.includes(day.dateISO);
          const isSelected =
            selectedRange?.checkIn === day.dateISO ||
            selectedRange?.checkOut === day.dateISO;
          const isDisabled = day.isPast || isUnavailable || !day.isCurrentMonth;

          return (
            <button
              key={day.dateISO}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate?.(day.dateISO)}
              className={[
                "aspect-square text-xs",
                !day.isCurrentMonth ? "text-muted/40" : "text-ink",
                isUnavailable ? "bg-cream-line line-through" : "",
                isSelected ? "bg-sage text-paper" : "",
                isDisabled ? "cursor-not-allowed" : "hover:bg-cream",
              ].join(" ")}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-cream-line" /> {t("unavailable")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-sage" /> {t("selected")}
        </span>
      </div>
    </div>
  );
}
