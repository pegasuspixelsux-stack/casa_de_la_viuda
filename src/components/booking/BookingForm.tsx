"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createReservationRequest } from "@/services/reservations";
import { rangeIncludesUnavailable } from "@/lib/dates";
import type { Property } from "@/types/property";
import type { ReservationRequest } from "@/types/reservation";

type BookingFormProps = {
  properties: Property[];
  initialPropertySlug?: string;
};

type FormErrors = Partial<Record<keyof ReservationRequest, string>>;

export function BookingForm({ properties, initialPropertySlug }: BookingFormProps) {
  const t = useTranslations("booking.form");
  const tConfirmation = useTranslations("booking.confirmation");

  const initialSlug =
    properties.find((property) => property.slug === initialPropertySlug)
      ?.slug ??
    properties[0]?.slug ??
    "";

  const [form, setForm] = useState<ReservationRequest>({
    propertySlug: initialSlug,
    guestName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "confirmed">(
    "idle"
  );
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  const selectedProperty = properties.find(
    (property) => property.slug === form.propertySlug
  );

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!form.propertySlug) nextErrors.propertySlug = t("errors.propertySlug");
    if (!form.guestName.trim()) nextErrors.guestName = t("errors.guestName");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t("errors.email");
    if (!form.phone.trim()) nextErrors.phone = t("errors.phone");
    if (!form.checkIn) nextErrors.checkIn = t("errors.checkIn");
    if (!form.checkOut) nextErrors.checkOut = t("errors.checkOut");
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      nextErrors.checkOut = t("errors.checkOutBeforeCheckIn");
    }
    if (
      form.checkIn &&
      form.checkOut &&
      selectedProperty &&
      rangeIncludesUnavailable(
        form.checkIn,
        form.checkOut,
        selectedProperty.unavailableDates
      )
    ) {
      nextErrors.checkIn = t("errors.unavailableRange");
    }
    if (form.guests < 1) {
      nextErrors.guests = t("errors.guestsMin");
    } else if (selectedProperty && form.guests > selectedProperty.maxGuests) {
      nextErrors.guests = t("errors.guestsMax", {
        count: selectedProperty.maxGuests,
      });
    }
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    const reservation = await createReservationRequest(form);
    setConfirmationId(reservation.id);
    setStatus("confirmed");
  }

  if (status === "confirmed") {
    return (
      <div className="border border-sage bg-cream px-8 py-12 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-sage uppercase">
          {tConfirmation("eyebrow")}
        </p>
        <h2 className="mt-4 font-display text-2xl text-ink">
          {tConfirmation("title", { name: form.guestName.split(" ")[0] })}
        </h2>
        <p className="mt-3 text-sm text-ink/70">
          {tConfirmation("referencePrefix")}{" "}
          <span className="font-medium text-ink">{confirmationId}</span>.{" "}
          {tConfirmation("referenceSuffix")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 sm:grid-cols-2">
      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.roomSuite")}
        </span>
        <select
          value={form.propertySlug}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              propertySlug: event.target.value,
            }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        >
          {properties.map((property) => (
            <option key={property.slug} value={property.slug}>
              {property.name}
            </option>
          ))}
        </select>
        {errors.propertySlug ? (
          <span className="text-xs text-red-600">{errors.propertySlug}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.fullName")}
        </span>
        <input
          type="text"
          value={form.guestName}
          onChange={(event) =>
            setForm((current) => ({ ...current, guestName: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.guestName ? (
          <span className="text-xs text-red-600">{errors.guestName}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.email")}
        </span>
        <input
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({ ...current, email: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.email ? (
          <span className="text-xs text-red-600">{errors.email}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.phone")}
        </span>
        <input
          type="tel"
          value={form.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, phone: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.phone ? (
          <span className="text-xs text-red-600">{errors.phone}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.guests")}
        </span>
        <input
          type="number"
          min={1}
          value={form.guests}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              guests: Number(event.target.value),
            }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.guests ? (
          <span className="text-xs text-red-600">{errors.guests}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.checkIn")}
        </span>
        <input
          type="date"
          value={form.checkIn}
          onChange={(event) =>
            setForm((current) => ({ ...current, checkIn: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.checkIn ? (
          <span className="text-xs text-red-600">{errors.checkIn}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.checkOut")}
        </span>
        <input
          type="date"
          value={form.checkOut}
          onChange={(event) =>
            setForm((current) => ({ ...current, checkOut: event.target.value }))
          }
          className="border border-cream-line px-4 py-3 text-sm"
        />
        {errors.checkOut ? (
          <span className="text-xs text-red-600">{errors.checkOut}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 sm:col-span-2">
        <span className="text-xs font-medium tracking-[0.15em] text-muted uppercase">
          {t("labels.message")}
        </span>
        <textarea
          value={form.message}
          onChange={(event) =>
            setForm((current) => ({ ...current, message: event.target.value }))
          }
          rows={4}
          className="border border-cream-line px-4 py-3 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-sage px-8 py-4 text-xs font-medium tracking-[0.2em] text-paper uppercase hover:bg-sage-dark disabled:opacity-60 sm:col-span-2"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
