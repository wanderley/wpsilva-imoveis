"use client";

import { Lot } from "@/features/auction/scrap/components/Lot";

export default function Page({ params }: { params: { id: number } }) {
  return (
    <div className="container mx-auto p-4">
      <Lot scrapID={params.id} />
    </div>
  );
}
