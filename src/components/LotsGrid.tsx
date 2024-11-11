import { ScrapWithFiles } from "@/db/schema";
import { Pagination } from "flowbite-react";

import LotCard from "./LotCard";

export function LotsGrid({
  lots,
  openLotMode,
  currentPage,
  itemsPerPage,
  onPageChange,
}: {
  lots: ScrapWithFiles[];
  openLotMode: "page" | "modal";
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = lots.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
        {currentItems.map((lot: ScrapWithFiles) => (
          <LotCard key={lot.id} lot={lot} mode={openLotMode} />
        ))}
      </div>
      <div className="flex overflow-x-auto sm:justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(lots.length / itemsPerPage)}
          onPageChange={onPageChange}
          showIcons={true}
          previousLabel="Anterior"
          nextLabel="Próxima"
        />
      </div>
    </>
  );
}
