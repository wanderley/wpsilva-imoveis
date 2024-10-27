import { getScrapDetails } from "@/actions";
import { LotStatusBadge } from "@/components/LotStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { Button, Carousel, Modal } from "flowbite-react";
import React, { useEffect } from "react";
import { CheckSquare, ExternalLink, FileText } from "react-feather";

interface Props {
  scrapID: number;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export function LotModal({ scrapID, showModal, setShowModal }: Props) {
  const { data: scrap, isLoading } = useQuery({
    queryKey: ["scrapDetails", scrapID],
    queryFn: async () => await getScrapDetails(scrapID),
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, setShowModal]);

  return (
    <Modal show={showModal} onClose={() => setShowModal(false)} size="7xl">
      {scrap && <Modal.Header>{scrap.name}</Modal.Header>}
      <Modal.Body>
        {isLoading && <p>Carregando...</p>}
        {scrap && (
          <div className="space-y-4">
            <div className="h-56 sm:h-64 xl:h-80 2xl:h-96 mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Carousel className="h-full">
                {scrap.files
                  .filter((file) => file.file_type === "jpg")
                  .map((image) => (
                    <div
                      key={image.id}
                      className="flex items-center justify-center h-full"
                    >
                      <img
                        src={image.url}
                        alt={`Imagem ${image.id}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ))}
              </Carousel>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3">
                <div className="mb-4">
                  <dt className="font-semibold">Endereço:</dt>
                  <dd>{scrap.address || "N/A"}</dd>
                </div>
                <div className="flex flex-col items-center mb-6">
                  <p className="font-normal text-gray-700 dark:text-gray-400">
                    <strong>Descrição:</strong>{" "}
                    {scrap.description || "Não disponível"}
                  </p>
                </div>
              </div>
              <div className="w-px bg-gray-200 dark:bg-gray-700 self-stretch hidden lg:block"></div>
              <div className="lg:w-1/3">
                <dl className="space-y-2">
                  <div>
                    <dt className="font-semibold">Avaliação:</dt>
                    <dd>R$ {scrap.appraisal?.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Lance Atual:</dt>
                    <dd className="text-2xl font-bold text-green-600">
                      R$ {scrap.bid?.toLocaleString() || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Incremento Mínimo:</dt>
                    <dd>
                      R$ {scrap.minimum_increment?.toLocaleString() || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">1º Leilão:</dt>
                    <dd>
                      {scrap.first_auction_date
                        ? `${new Date(scrap.first_auction_date).toLocaleString()} - R$ ${scrap.first_auction_bid?.toLocaleString()}`
                        : "Não definido"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">2º Leilão:</dt>
                    <dd>
                      {scrap.second_auction_date
                        ? `${new Date(scrap.second_auction_date).toLocaleString()} - R$ ${scrap.second_auction_bid?.toLocaleString()}`
                        : "Não definido"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Status:</dt>
                    <dd>
                      <LotStatusBadge scrap={scrap} />
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Última Atualização:</dt>
                    <dd>{new Date(scrap.updated_at).toLocaleString()}</dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <div className="pb-2">
                    <Button
                      color="light"
                      className="flex items-center justify-center gap-2"
                      href={scrap.url}
                      target="_blank"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Site do Leilão
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {scrap.edital_link && (
                      <Button
                        color="light"
                        className="flex items-center justify-center gap-2"
                        href={scrap.edital_link}
                        target="_blank"
                      >
                        <FileText className="w-4 h-4" />
                        Edital
                      </Button>
                    )}
                    {scrap.matricula_link && (
                      <Button
                        color="light"
                        className="flex items-center justify-center gap-2"
                        href={scrap.matricula_link}
                        target="_blank"
                      >
                        <FileText className="w-4 h-4" />
                        Matrícula
                      </Button>
                    )}
                    {scrap.laudo_link && (
                      <Button
                        color="light"
                        className="flex items-center justify-center gap-2"
                        href={scrap.laudo_link}
                        target="_blank"
                      >
                        <CheckSquare className="w-4 h-4" />
                        Laudo
                      </Button>
                    )}
                    {scrap.case_link && (
                      <Button
                        color="light"
                        className="flex items-center justify-center gap-2"
                        href={scrap.case_link}
                        target="_blank"
                      >
                        <FileText className="w-4 h-4" />
                        Processo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
