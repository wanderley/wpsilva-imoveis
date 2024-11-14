"use client";

import { SCRAPERS } from "@/app/scraper/constants";
import { LotsGrid } from "@/components/LotsGrid";
import {
  useRefreshScrapsMutation,
  useScraps,
} from "@/features/auction/scraper/hooks";
import { usePagination } from "@/hooks";
import { Button } from "flowbite-react";

function UpdateButton({ scraperID }: { scraperID: string }) {
  const { isPending, mutate } = useRefreshScrapsMutation();
  return (
    <Button
      size="sm"
      color="failure"
      disabled={isPending}
      onClick={() => mutate({ scraperID })}
    >
      Forçar Atualização
    </Button>
  );
}

export default function Page({ params }: { params: { id: number } }) {
  const scraperID = SCRAPERS[params.id];
  const { isLoading, data } = useScraps(scraperID);
  const { currentPage, setCurrentPage, itemsPerPage } = usePagination();

  return (
    <div className="container mx-auto p-4">
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Site: {scraperID}</h2>
          <UpdateButton scraperID={scraperID} />
        </div>
        {isLoading && <p>Carregando...</p>}
        {!isLoading && data?.length == 0 && <p>Nenhum lote encontrado!</p>}
        {!isLoading && data?.length != 0 && (
          <LotsGrid
            lots={data || []}
            openLotMode={"modal"}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </section>
    </div>
  );
}
