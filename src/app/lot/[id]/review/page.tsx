"use client";

import { EditarLote } from "@/features/auction/scrap/components/EditarLote";

export default function Page({ params }: { params: { id: number } }) {
  return (
    <div className="container mx-auto p-4">
      <EditarLote scrapId={params.id} />
    </div>
  );
}
