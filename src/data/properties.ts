import type { Property } from "@/types/property";

export const properties: Property[] = [
  {
    slug: "deluxe-suite",
    name: "Master Bedroom",
    category: "Bedroom",
    shortDescription:
      "A sea-facing bedroom with a private terrace and soaking tub.",
    description:
      "The home's largest bedroom pairs a king bed with a separate sitting area and a private terrace overlooking the pool and coastline. Finished in warm oak and linen, the Master Bedroom is built for slow mornings and long evenings by the water.",
    images: ["Sea-facing terrace", "King bedroom", "Marble soaking tub"],
    cardImage: "/images/double_room.png",
    amenities: [
      "Private terrace",
      "Soaking tub",
      "Espresso machine",
      "Air conditioning",
      "King bed",
      "Sea view",
    ],
    sizeSqm: 42,
    bedConfiguration: "1 King Bed",
  },
  {
    slug: "pool-view-room",
    name: "Second Bedroom",
    category: "Bedroom",
    shortDescription: "A bright second bedroom overlooking the infinity pool.",
    description:
      "A calm, light-filled bedroom with direct views over the infinity pool and cabanas — steps from the water without giving up quiet.",
    images: ["Pool-view balcony", "Queen bedroom", "Walk-in shower"],
    cardImage: "/images/single_room_2.png",
    amenities: [
      "Pool view",
      "Walk-in shower",
      "Air conditioning",
      "Queen bed",
      "Minibar",
    ],
    sizeSqm: 28,
    bedConfiguration: "1 Queen Bed",
  },
  {
    slug: "garden-apartment",
    name: "Living Room & Kitchen",
    category: "Living Space",
    shortDescription:
      "The home's shared living area and full kitchen, opening onto the garden.",
    description:
      "A self-contained living and dining area with a full kitchen, opening directly onto Casa de la Viuda's landscaped gardens — the heart of the home for gathering, cooking, and relaxing together.",
    images: ["Garden terrace", "Living area", "Full kitchen"],
    cardImage: "/images/single_room.png",
    amenities: [
      "Garden terrace",
      "Full kitchen",
      "Dining area",
      "Air conditioning",
      "Sofa seating",
    ],
    sizeSqm: 55,
  },
  {
    slug: "junior-suite",
    name: "Reading Nook",
    category: "Den",
    shortDescription: "A quiet den with a reading nook and courtyard view.",
    description:
      "A refined, quiet corner of the home overlooking the inner courtyard, with a dedicated reading nook and a deep soaking tub — a calm counterpoint to the pool-facing rooms.",
    images: ["Courtyard view", "Reading nook", "Soaking tub"],
    amenities: [
      "Courtyard view",
      "Reading nook",
      "Soaking tub",
      "Air conditioning",
    ],
    sizeSqm: 34,
  },
  {
    slug: "ocean-terrace-room",
    name: "Garden Terrace",
    category: "Outdoor",
    shortDescription:
      "A ground-floor terrace and outdoor space with direct garden access.",
    description:
      "Ground-floor and steps from the shoreline path, the Garden Terrace has its own outdoor lounge and outdoor shower — the closest outdoor space to the water at Casa de la Viuda.",
    images: ["Private sun terrace", "Outdoor shower", "Outdoor lounge"],
    amenities: [
      "Private terrace",
      "Outdoor shower",
      "Direct beach access",
      "Outdoor lounge seating",
    ],
    sizeSqm: 30,
  },
];
