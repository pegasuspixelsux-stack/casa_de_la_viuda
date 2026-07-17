import { delay } from "@/lib/delay";
import { properties } from "@/data/properties";
import type { Property } from "@/types/property";

const SIMULATED_LATENCY_MS = 150;

export async function getProperties(): Promise<Property[]> {
  await delay(SIMULATED_LATENCY_MS);
  return properties;
}

export async function getPropertySlugs(): Promise<string[]> {
  await delay(SIMULATED_LATENCY_MS);
  return properties.map((property) => property.slug);
}

export async function getPropertyBySlug(
  slug: string
): Promise<Property | undefined> {
  await delay(SIMULATED_LATENCY_MS);
  return properties.find((property) => property.slug === slug);
}
