export type Property = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  amenities: string[];
  maxGuests: number;
  sizeSqm: number;
  pricePerNight: number;
  bedConfiguration: string;
  unavailableDates: string[];
};
