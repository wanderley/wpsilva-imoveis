import { LotModal } from "@/components/LotModal";
import { ScrapWithFiles } from "@/db/schema";
import { Badge, Card, Carousel } from "flowbite-react";
import React, { useState } from "react";
import { HiClock } from "react-icons/hi";

export default function LotCard({ imovel }: { imovel: ScrapWithFiles }) {
  const [showModal, setShowModal] = useState(false);
  const discount = imovel.appraisal
    ? ((imovel.appraisal - (imovel.bid || 0)) / imovel.appraisal) * 100
    : 0;
  const discountColor = discount > 40 ? "success" : "warning";
  const nextAuctionDate =
    imovel.first_auction_date && imovel.first_auction_date >= new Date()
      ? new Date(imovel.first_auction_date)
      : imovel.second_auction_date && imovel.second_auction_date >= new Date()
        ? new Date(imovel.second_auction_date)
        : null;
  return (
    <>
      <Card
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setShowModal(true)}
      >
        <div className="flex flex-col h-full">
          <div className="h-40 mb-2">
            <Carousel slide={false} indicators={false}>
              {imovel.files
                .filter((file) => file.file_type === "jpg")
                .map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`Imagem ${index + 1} do imóvel`}
                    className="h-40 w-full object-cover"
                  />
                ))}
            </Carousel>
          </div>
          <div className="flex-grow">
            <h5
              className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white mb-1 line-clamp-1"
              title={imovel.name || "N/A"}
            >
              {imovel.name || "N/A"}
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
              Endereço: {imovel.address || "Endereço não disponível"}
            </p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              Lance Atual: R$ {imovel.bid?.toLocaleString() || "N/A"}
            </p>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avaliação: R$ {imovel.appraisal?.toLocaleString() || "N/A"}
              </p>
              <Badge color={discountColor} className="text-xs">
                {discount.toFixed(0)}% desc.
              </Badge>
            </div>
          </div>
          <div className="flex justify-end items-center mt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
              <HiClock className="mr-1" size={12} />
              {nextAuctionDate
                ? nextAuctionDate.toLocaleDateString()
                : "Data não definida"}
            </p>
          </div>
        </div>
      </Card>

      <LotModal
        scrapID={imovel.id}
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </>
  );
}
