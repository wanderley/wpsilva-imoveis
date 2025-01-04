import {
  Lot,
  LotsFilters,
  getLotsByFilter,
} from "@/features/auction/scrap/grid/api";
import { LotsGrid } from "@/features/auction/scrap/grid/components/LotsGrid";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

type Props = {
  openLotMode: "page" | "modal";
  itemsPerPage: number;
  filter: LotsFilters;
  onDataChange?: (lots: Lot[]) => void;
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <FaFolderOpen className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum lote encontrado
      </h3>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <Spinner size="lg" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Carregando lotes
      </h3>
    </div>
  );
}

export function LotsGridByFilter({
  openLotMode,
  itemsPerPage,
  filter,
  onDataChange,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: lots, isLoading } = useQuery({
    queryKey: ["lots", filter],
    queryFn: async () => await getLotsByFilter(filter),
  });
  useEffect(() => {
    if (isLoading) {
      onDataChange?.([]);
    }
    if (lots) {
      onDataChange?.(lots);
    }
  }, [lots, isLoading, onDataChange]);
  if (isLoading) {
    return <LoadingState />;
  }
  if (lots?.length === 0) {
    return <EmptyState />;
  }
  return (
    <LotsGrid
      lots={lots ?? []}
      openLotMode={openLotMode}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
    />
  );
}
