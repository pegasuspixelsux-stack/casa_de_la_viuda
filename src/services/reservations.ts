"use server";

import { randomUUID } from "node:crypto";
import { delay } from "@/lib/delay";
import type { Reservation, ReservationRequest } from "@/types/reservation";

const SIMULATED_LATENCY_MS = 400;

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
