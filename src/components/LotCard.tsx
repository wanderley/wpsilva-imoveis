import { LotModal } from "@/components/LotModal";
import { ScrapWithFiles } from "@/db/schema";
import { Badge, Card, Carousel } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiClock } from "react-icons/hi";

function BottomContent({ lot }: { lot: ScrapWithFiles }) {
  const discount = lot.appraisal
    ? ((lot.appraisal - (lot.bid || 0)) / lot.appraisal) * 100
    : 0;
  const discountColor =
    discount > 40 ? "success" : discount <= 0 ? "red" : "warning";
  const nextAuctionDate =
    lot.first_auction_date && lot.first_auction_date >= new Date()
      ? new Date(lot.first_auction_date)
      : lot.second_auction_date && lot.second_auction_date >= new Date()
        ? new Date(lot.second_auction_date)
        : null;
  return (
    <>
      {" "}
      <div className="flex-grow">
        <h5
          className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white mb-1 line-clamp-1"
          title={lot.name || "N/A"}
        >
          {lot.name || "N/A"}
        </h5>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
          Endereço: {lot.address || "Endereço não disponível"}
        </p>
        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
          Lance Atual: R$ {lot.bid?.toLocaleString() || "N/A"}
        </p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avaliação: R$ {lot.appraisal?.toLocaleString() || "N/A"}
          </p>
          <div className="flex gap-1">
            <Badge color={discountColor} className="text-xs">
              {discount.toFixed(0)}% desc.
            </Badge>
            <Badge
              color={
                lot.lucro_percentual !== null && lot.lucro_percentual > 0
                  ? "success"
                  : "red"
              }
              className="text-xs"
            >
              {Math.abs(lot.lucro_percentual ?? 0).toFixed(0)}%{" "}
              {lot.lucro_percentual !== null && lot.lucro_percentual > 0
                ? "lucro"
                : "prejuízo"}
            </Badge>
          </div>
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
    </>
  );
}

function CardLink({
  lot,
  mode,
  children,
}: {
  lot: ScrapWithFiles;
  mode: "page" | "modal";
  children: React.ReactNode;
}) {
  const [showModal, setShowModal] = useState(false);
  if (mode == "page") {
    return <Link href={`/lot/${lot.id}`}>{children}</Link>;
  }
  return (
    <>
      <div onClick={() => setShowModal(true)}>{children}</div>
      {showModal && (
        <LotModal
          scrapID={lot.id}
          showModal={true}
          setShowModal={setShowModal}
        />
      )}
    </>
  );
}

export default function LotCard({
  lot,
  mode,
}: {
  lot: ScrapWithFiles;
  mode: "page" | "modal";
}) {
  return (
    <>
      <Card className="cursor-pointer hover:bg-gray-50">
        <div className="flex flex-col h-full">
          <div className="h-40 mb-2">
            <Carousel slide={false} indicators={false}>
              {lot.files
                .filter((file) => file.file_type === "jpg")
                .map((image, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`Imagem ${index + 1} do imóvel`}
                    className="h-40 w-full object-cover"
                  />
                ))}
            </Carousel>
          </div>
          <CardLink lot={lot} mode={mode}>
            <BottomContent lot={lot} />
          </CardLink>
        </div>
      </Card>
    </>
  );
}
