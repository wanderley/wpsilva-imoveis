import { getInterestingLots } from "@/actions";
import LotCard from "@/components/LotCard";
import { ScrapWithFiles } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import { Pagination, Spinner } from "flowbite-react";
import React, { useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <FaFolderOpen className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum lote interessante
      </h3>
      <p className="text-gray-500">
        Quando você marcar lotes como interessantes, eles aparecerão aqui.
      </p>
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
      <p className="text-gray-500">Buscando seus lotes interessantes...</p>
    </div>
  );
}

function LotsGrid({
  lots,
  currentPage,
  itemsPerPage,
  onPageChange,
}: {
  lots: ScrapWithFiles[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (lots.length === 0) {
    return <EmptyState />;
  }
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = lots.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
        {currentItems.map((imovel: ScrapWithFiles) => (
          <LotCard key={imovel.id} imovel={imovel} />
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

export function InterestingLots() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { data, isLoading } = useQuery<ScrapWithFiles[]>({
    queryKey: ["interesting-lots"],
    queryFn: async () => await getInterestingLots(),
    initialData: [],
  });

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Lotes Interessantes</h2>
      </div>
      {isLoading ? (
        <LoadingState />
      ) : (
        <LotsGrid
          lots={data || []}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}
    </section>
  );
}
