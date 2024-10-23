"use client";

import {
  getScrapDetails,
  getScraps,
  refreshScraps,
  updateScrap,
} from "@/actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Carousel, Table } from "flowbite-react";
import { useState } from "react";

import { SCRAPERS } from "../constants";

const ScrapDetails = ({ scrapId }: { scrapId: number | null }) => {
  const { data: scrapDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["scrapDetails", scrapId],
    queryFn: async () => (scrapId ? await getScrapDetails(scrapId) : null),
    enabled: !!scrapId,
  });

  if (isLoadingDetails) return <p>Carregando detalhes...</p>;
  if (!scrapDetails) return null;

  const images = scrapDetails.documents?.filter(
    (doc) => doc?.document_type === "imagem_lote",
  );

  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="text-xl mb-2">Detalhes do Lote</h3>
      <p>
        <strong>Endereço:</strong> {scrapDetails.address}
      </p>
      <p>
        <strong>Descrição:</strong> {scrapDetails.description}
      </p>
      <p>
        <strong>Número do Caso:</strong> {scrapDetails.case_number}
      </p>
      <p>
        <strong>Link do Caso:</strong>{" "}
        <a
          href={scrapDetails.case_link || ""}
          target="_blank"
          rel="noopener noreferrer"
        >
          {scrapDetails.case_link || ""}
        </a>
      </p>
      <p>
        <strong>Lance:</strong> R$ {scrapDetails.bid?.toFixed(2)}
      </p>
      <p>
        <strong>Incremento Mínimo:</strong> R${" "}
        {scrapDetails.minimum_increment?.toFixed(2)}
      </p>
      <p>
        <strong>Data do Primeiro Leilão:</strong>{" "}
        {scrapDetails.first_auction_date?.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })}
      </p>
      <p>
        <strong>Lance do Primeiro Leilão:</strong> R${" "}
        {scrapDetails.first_auction_bid?.toFixed(2)}
      </p>
      <p>
        <strong>Data do Segundo Leilão:</strong>{" "}
        {scrapDetails.second_auction_date?.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })}
      </p>
      <p>
        <strong>Lance do Segundo Leilão:</strong> R${" "}
        {scrapDetails.second_auction_bid?.toFixed(2)}
      </p>

      {images && images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg mb-2">Imagens:</h4>
          <div className="h-64 sm:h-72 md:h-80 lg:h-96">
            <Carousel>
              {images.map((doc, index) => (
                <div
                  key={index}
                  className="flex h-full items-center justify-center bg-gray-900 dark:bg-black"
                >
                  <img
                    src={doc?.url || ""}
                    alt={`Imagem ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      )}

      {scrapDetails.documents && scrapDetails.documents.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg mb-2">Documentos:</h4>
          <ul className="list-disc pl-5">
            {scrapDetails.documents
              .filter((doc) => doc?.document_type !== "imagem_lote")
              .map((doc, index) => (
                <li key={index}>
                  <a
                    href={doc?.url || ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {doc?.document_type === "edital"
                      ? "Edital"
                      : doc?.document_type === "laudo"
                        ? "Laudo"
                        : doc?.document_type === "matricula"
                          ? "Matrícula"
                          : "Documento"}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function Page({ params }: { params: { id: number } }) {
  const scrapID = SCRAPERS[params.id];
  const [selectedScrapId, setSelectedScrapId] = useState<number | null>(null);

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
          <Table striped>
            <Table.Head>
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
                    onClick={() => setSelectedScrapId(scrap.id)}
                    className="cursor-pointer hover:underline"
                  >
                    {scrap.url}
                  </Table.Cell>
                  <Table.Cell className="text-center">
                    <Badge
                      color={scrap.is_fetched ? "success" : "warning"}
                      className="inline-block"
                    >
                      {scrap.is_fetched ? "Carregado" : "Não carregado"}
                    </Badge>
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
        </>
      )}
      <ScrapDetails scrapId={selectedScrapId} />
    </div>
  );
}
