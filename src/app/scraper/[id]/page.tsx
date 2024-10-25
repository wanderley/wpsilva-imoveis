"use client";

import {
  getScrapDetails,
  getScraps,
  refreshScraps,
  updateScrap,
} from "@/actions";
import { SCRAPERS } from "@/app/scraper/constants";
import { LotModal } from "@/components/LotModal";
import { LotStatusBadge } from "@/components/LotStatusBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Table } from "flowbite-react";
import { useState } from "react";

export default function Page({ params }: { params: { id: number } }) {
  const scrapID = SCRAPERS[params.id];
  const [selectedScrapId, setSelectedScrapId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const queryClient = useQueryClient();
  const { isLoading, data } = useQuery({
    queryKey: ["scraps", scrapID],
    queryFn: async () => await getScraps(scrapID),
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async ({ scrapID }: { scrapID: string }) =>
      await refreshScraps(scrapID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scraps", scrapID] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      scrapID,
      url,
    }: {
      scrapID: string;
      url: string;
      id: number;
    }) => await updateScrap(scrapID, url),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["scraps", scrapID] });
      queryClient.invalidateQueries({ queryKey: ["scrapDetails", id] });
      setSelectedScrapId(id);
    },
    onError: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["scraps", scrapID] });
      queryClient.invalidateQueries({ queryKey: ["scrapDetails", id] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl">Site: {scrapID}</h1>
      <br />
      <Button
        size="sm"
        disabled={isPending}
        color="failure"
        onClick={() => mutate({ scrapID })}
      >
        Forçar Atualização
      </Button>
      <br />
      {!isLoading && data?.length == 0 && <p>Nenhum lote encontrado!</p>}
      {!isLoading && data?.length != 0 && (
        <>
          <h2 className="text-xl mt-4 mb-2">Páginas encontradas:</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-200 rounded-lg shadow">
            <Table striped className="w-full">
              <Table.Head className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <Table.HeadCell>URL</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Ações</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {data?.map((scrap) => (
                  <Table.Row
                    key={scrap.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell
                      onClick={() => {
                        setSelectedScrapId(scrap.id);
                        setShowModal(true);
                      }}
                      className="cursor-pointer hover:underline truncate max-w-xs"
                    >
                      {scrap.url}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <LotStatusBadge scrap={scrap} />
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({
                            scrapID,
                            url: scrap.url,
                            id: scrap.id,
                          });
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Update
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </>
      )}
      {selectedScrapId && (
        <LotModal
          scrapID={selectedScrapId}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
}
