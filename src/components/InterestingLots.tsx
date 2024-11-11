import { ScrapWithFiles } from "@/db/schema";
import { getInterestingLots } from "@/models/scraps/actions";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { FaFolderOpen } from "react-icons/fa";

import { LotsGrid } from "./LotsGrid";

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

export function InterestingLots() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading } = useQuery<ScrapWithFiles[]>({
    queryKey: ["interesting-lots"],
    queryFn: async () => await getInterestingLots(),
  });
  let body = <></>;
  if (isLoading) {
    body = <LoadingState />;
  } else if (data?.length === 0) {
    body = <EmptyState />;
  } else {
    body = (
      <LotsGrid
        lots={data || []}
        openLotMode={"page"}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Lotes Interessantes</h2>
        {data?.length && (
          <Link href="/lots?phase=interesting">
            <Button color="dark">Ver Todos</Button>
          </Link>
        )}
      </div>
      {body}
    </section>
  );
}
