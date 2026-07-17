"use server";

import { randomUUID } from "node:crypto";
import { delay } from "@/lib/delay";
import type { Reservation, ReservationRequest } from "@/types/reservation";

const SIMULATED_LATENCY_MS = 400;

// This file is the seam that gets replaced with real Firebase calls; callers don't change.
// TODO: input is only client-validated today (mock, unpersisted) — add server-side re-validation before this becomes a real write path.
export async function createReservationRequest(
  input: ReservationRequest
): Promise<Reservation> {
  await delay(SIMULATED_LATENCY_MS);
  return {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}
