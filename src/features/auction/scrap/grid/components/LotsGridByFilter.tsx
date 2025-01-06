import {
  Lot,
  LotsFilters,
  getLotsByFilter,
} from "@/features/auction/scrap/grid/api";
import { LotsGrid } from "@/features/auction/scrap/grid/components/LotsGrid";
import { LotsMap } from "@/features/auction/scrap/grid/components/LotsMap";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import { FaFolderOpen, FaMap, FaThLarge } from "react-icons/fa";

type Props = {
  openLotMode: "page" | "modal";
  itemsPerPage: number;
  filter: LotsFilters;
  showHeader?: boolean;
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
  showHeader = false,
  onDataChange,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: lots, isLoading } = useQuery({
    queryKey: ["lots", filter],
    queryFn: async () => await getLotsByFilter(filter),
  });
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
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
    <div>
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {lots?.length == 1
              ? `${lots?.length} lote encontrado`
              : `${lots?.length} lotes encontrados`}
          </h3>
          <div className="flex gap-2">
            <Button
              color={viewMode === "grid" ? "dark" : "light"}
              onClick={() => setViewMode("grid")}
              size="sm"
            >
              <FaThLarge className="mr-2" /> Grade
            </Button>
            <Button
              color={viewMode === "map" ? "dark" : "light"}
              onClick={() => setViewMode("map")}
              size="sm"
            >
              <FaMap className="mr-2" /> Mapa
            </Button>
          </div>
        </div>
      )}
      {viewMode === "grid" ? (
        <LotsGrid
          lots={lots ?? []}
          openLotMode={openLotMode}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      ) : (
        <LotsMap lots={lots ?? []} />
      )}
    </div>
  );
}
