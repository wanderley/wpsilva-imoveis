import { Lot } from "@/features/auction/scrap/grid/api";
import LotCard from "@/features/auction/scrap/grid/components/LotCard";
import { Pagination } from "flowbite-react";

export function LotsGrid({
  lots,
  openLotMode,
  currentPage,
  itemsPerPage,
  onPageChange,
}: {
  lots: Lot[];
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
        {currentItems.map((lot: Lot) => (
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
