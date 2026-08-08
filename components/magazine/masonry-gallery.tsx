"use client";

import type { Photo } from "@/types/database";

type MasonryGalleryProps = {
  photos: Photo[];
};

export function MasonryGallery({ photos }: MasonryGalleryProps) {
  if (photos.length === 0) {
    return (
      <p className="px-6 py-12 text-sm text-[#f4ead7]/45">
        Aún no hay fotos aprobadas para esta edición.
      </p>
    );
  }

  return (
    <section className="px-6 py-12">
      <h2 className="font-display text-3xl text-[#f8f0e3] print:text-black">
        Galería
      </h2>
      <p className="mt-2 text-sm text-[#f4ead7]/45 print:text-neutral-600">
        Momentos aprobados, etiquetados por mesa
      </p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="mb-4 break-inside-avoid border border-[#D4AF37]/15 bg-[#12100e] print:border-neutral-300"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.photo_url}
              alt={`Mesa ${photo.table_number}`}
              className="w-full object-cover"
            />
            <figcaption className="px-3 py-2 text-xs uppercase tracking-wider text-[#D4AF37] print:text-neutral-700">
              Mesa {photo.table_number}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
