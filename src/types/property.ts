export type Property = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  images: string[];
  cardImage?: string;
  amenities: string[];
  maxGuests: number;
  sizeSqm: number;
  pricePerNight: number;
  bedConfiguration: string;
  unavailableDates: string[];
};

export type HomeListing = {
  slug: string;
  name: string;
  description: string;
  amenities: string[];
  pricePerNight: number;
  maxGuests: number;
  unavailableDates: string[];
};
