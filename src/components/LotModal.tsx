import { getScrapDetails } from "@/actions";
import { LotStatusBadge } from "@/components/LotStatusBadge";
import { useQuery } from "@tanstack/react-query";
import { Button, Carousel, Modal } from "flowbite-react";
import React, { useEffect } from "react";
import {
  HiDocumentDuplicate,
  HiDocumentSearch,
  HiDocumentText,
  HiExternalLink,
} from "react-icons/hi";

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
    <Modal show={showModal} onClose={() => setShowModal(false)}>
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

            <p>
              <strong>Endereço:</strong> {scrap.address || "N/A"}
            </p>
            <p>
              <strong>Descrição:</strong>{" "}
              {scrap.description
                ? scrap.description.split("\n").map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))
                : "Não disponível"}
            </p>
            <p>
              <strong>Lance Atual:</strong> R${" "}
              {scrap.bid?.toLocaleString() || "N/A"}
            </p>
            <p>
              <strong>Incremento Mínimo:</strong> R${" "}
              {scrap.minimum_increment?.toLocaleString() || "N/A"}
            </p>
            <p>
              <strong>1º Leilão:</strong>{" "}
              {scrap.first_auction_date
                ? `${new Date(scrap.first_auction_date).toLocaleString()} - R$ ${scrap.first_auction_bid?.toLocaleString()}`
                : "Não definido"}
            </p>
            <p>
              <strong>2º Leilão:</strong>{" "}
              {scrap.second_auction_date
                ? `${new Date(scrap.second_auction_date).toLocaleString()} - R$ ${scrap.second_auction_bid?.toLocaleString()}`
                : "Não definido"}
            </p>
            <p>
              <strong>Status:</strong> <LotStatusBadge scrap={scrap} />
            </p>
            <p>
              <strong>Última Atualização:</strong>{" "}
              {new Date(scrap.updated_at).toLocaleString()}
            </p>

            <div className="flex space-x-2">
              {scrap.edital_link && (
                <Button
                  size="sm"
                  color="light"
                  href={scrap.edital_link}
                  target="_blank"
                >
                  <HiDocumentSearch className="mr-1" size={16} />
                  Edital
                </Button>
              )}
              {scrap.matricula_link && (
                <Button
                  size="sm"
                  color="light"
                  href={scrap.matricula_link}
                  target="_blank"
                >
                  <HiDocumentDuplicate className="mr-1" size={16} />
                  Matrícula
                </Button>
              )}
              {scrap.laudo_link && (
                <Button
                  size="sm"
                  color="light"
                  href={scrap.laudo_link}
                  target="_blank"
                >
                  <HiDocumentText className="mr-1" size={16} />
                  Laudo
                </Button>
              )}
              {scrap.case_link && (
                <Button
                  size="sm"
                  color="light"
                  href={scrap.case_link}
                  target="_blank"
                >
                  <HiExternalLink className="mr-1" size={16} />
                  Processo
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
