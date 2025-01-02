"use client";

import { LotsGridByFilter } from "@/features/auction/scrap/grid/components/LotsGridByFilter";
import { Button } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";

function InterestingLots() {
  const [hasLots, setHasLots] = useState(false);
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Lotes Interessantes</h2>
        {hasLots && (
          <Link href="/lots?phase=interesting">
            <Button color="dark">Ver Todos</Button>
          </Link>
        )}
      </div>
      <LotsGridByFilter
        onDataChange={(lots) => setHasLots(lots.length > 0)}
        openLotMode={"page"}
        itemsPerPage={6}
        filter={{
          min: "",
          max: "",
          phase: "interesting",
          active: "",
          auctionStatus: "all",
          profitMin: "",
        }}
      />
    </section>
  );
}

function PendingReviewLots() {
  const [hasLots, setHasLots] = useState(false);
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Lotes com Revisão Pendente</h2>
        {hasLots && (
          <Link href="/lots?phase=pendingReview">
            <Button color="dark">Ver Todos</Button>
          </Link>
        )}
      </div>
      <LotsGridByFilter
        onDataChange={(lots) => setHasLots(lots.length > 0)}
        openLotMode={"page"}
        itemsPerPage={6}
        filter={{
          min: "",
          max: "",
          phase: "pendingReview",
          active: "",
          auctionStatus: "available",
          profitMin: "",
        }}
      />
    </section>
  );
}

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <InterestingLots />
      <PendingReviewLots />
    </div>
  );
}
