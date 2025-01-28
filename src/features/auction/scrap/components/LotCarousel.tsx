import { type Scrap } from "@/db/schema";
import { Carousel } from "flowbite-react";

export function LoteImagens({
  scrap,
  className,
}: {
  scrap: Scrap;
  className: string;
}) {
  return (
    <Carousel className={className}>
      {scrap.files
        .filter((file) => file.file_type === "jpg")
        .map((image) => (
          <div
            key={image.id}
            className="flex items-center justify-center h-full"
          >
            here
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={`Imagem ${image.id}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ))}
    </Carousel>
  );
}
