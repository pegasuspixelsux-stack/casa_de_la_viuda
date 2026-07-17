"use client";

import { useState } from "react";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";

type GalleryProps = {
  images: string[];
};

export function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <PhotoPlaceholder label="No photos yet" className="aspect-[16/10] w-full" />
    );
  }

  return (
    <div>
      <PhotoPlaceholder
        label={images[activeIndex]}
        variant="dark"
        className="aspect-[16/10] w-full"
      />
      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo: ${image}`}
              aria-current={index === activeIndex}
              className={`outline-offset-2 ${
                index === activeIndex ? "outline outline-sage" : ""
              }`}
            >
              <PhotoPlaceholder label={image} className="aspect-square w-full" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
