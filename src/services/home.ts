import { delay } from "@/lib/delay";
import { home } from "@/data/home";
import type { HomeListing } from "@/types/property";

const SIMULATED_LATENCY_MS = 150;

// This file is the seam that gets replaced with real Firebase calls; callers don't change.
export async function getHome(): Promise<HomeListing> {
  await delay(SIMULATED_LATENCY_MS);
  return home;
}
