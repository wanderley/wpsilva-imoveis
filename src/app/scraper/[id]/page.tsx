"use client";

import { LotsGrid } from "@/components/LotsGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReport } from "@/features/auction/scraper/api";
import ReportOverview from "@/features/auction/scraper/components/ReportOverview";
import {
  useRefreshScrapsMutation,
  useScraps,
} from "@/features/auction/scraper/hooks";
import { ScrapStatus } from "@/features/auction/scraper/repository";
import { queryKeys, usePagination } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { Button } from "flowbite-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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

const validStatuses: ScrapStatus[] = [
  "all",
  "success",
  "failed",
  "incomplete",
  "without-analysis",
  "not-fetched",
];

function useStatusFilter(): [ScrapStatus, (newStatus?: ScrapStatus) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getStatusFromURL = useCallback((): ScrapStatus => {
    const statusParam = searchParams.get("status");
    return validStatuses.includes(statusParam as ScrapStatus)
      ? (statusParam as ScrapStatus)
      : "all";
  }, [searchParams]);

  const setStatus = useCallback(
    (newStatus?: ScrapStatus) => {
      const updatedStatus =
        newStatus && validStatuses.includes(newStatus) ? newStatus : "all";

      const newSearchParams = new URLSearchParams(searchParams.toString());
      if (updatedStatus !== "all") {
        newSearchParams.set("status", updatedStatus);
      } else {
        newSearchParams.delete("status");
      }

      router.push(`${pathname}?${newSearchParams.toString()}`);
    },
    [pathname, searchParams, router],
  );

  return [getStatusFromURL(), setStatus];
}

export default function Page({ params }: { params: { id: string } }) {
  const scraperID = params.id;
  const [status, setStatus] = useStatusFilter();
  const { isLoading, data } = useScraps(scraperID, status);
  const { isLoading: isLoadingOverview, data: overviewData } = useQuery({
    queryKey: queryKeys.scrapers,
    queryFn: async () => await getReport(),
  });
  const { currentPage, setCurrentPage, itemsPerPage } = usePagination();

  return (
    <div className="container mx-auto p-4">
      <section className="mb-12">
        <div className="flex flex-col gap-4">
          {!isLoadingOverview && overviewData && (
            <ReportOverview
              statusTotals={overviewData.summary.byScraperID[scraperID]}
              monthlyLots={overviewData.timeseries}
              scraperIDs={[scraperID]}
            />
          )}
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Site: {scraperID}</h2>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) => setStatus(value as ScrapStatus)}
              value={status}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="incomplete">Incompleto</SelectItem>
                <SelectItem value="without-analysis">Sem Análise</SelectItem>
                <SelectItem value="not-fetched">Não Baixado</SelectItem>
              </SelectContent>
            </Select>
            <UpdateButton scraperID={scraperID} />
          </div>
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
