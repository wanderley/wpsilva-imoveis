import { LotModal } from "@/components/LotModal";
import { selectOptionBasedOnProfitBand } from "@/components/lib/scraps";
import { Scrap } from "@/db/schema";
import AuctionStatus from "@/features/auction/scrap/components/AuctionStatus";
import { formatCurrency } from "@/lib/currency";
import { getPreferredAuctionDate } from "@/models/scraps/helpers";
import { Badge, Card, Carousel } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiClock } from "react-icons/hi";

type LotCardMode = "page" | "modal" | "new-page";

function parsePreferredAuctionDate(lot: Scrap) {
  const date = getPreferredAuctionDate(lot);
  if (!date) {
    return "Data não definida";
  }
  return date.toLocaleDateString("pt-BR");
}

function BottomContent({ lot }: { lot: Scrap }) {
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
          Lance Atual: {formatCurrency(lot.bid)}
        </p>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avaliação: {formatCurrency(lot.appraisal)}
          </p>
          {lot.profit && (
            <div className="flex gap-1">
              <Badge
                color={selectOptionBasedOnProfitBand(lot.profit, {
                  loss: "danger",
                  low_profit: "gray",
                  moderate_profit: "warning",
                  high_profit: "success",
                })}
                className="text-xs"
              >
                {Math.abs(lot.profit?.lucro_percentual ?? 0).toFixed(0)}%{" "}
                {selectOptionBasedOnProfitBand(lot.profit, {
                  loss: "prejuízo esperado",
                  else: "lucro esperado",
                })}
              </Badge>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end items-center mt-2">
        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
          <AuctionStatus scrap={lot} as="text" />
          <HiClock className="mr-1" size={12} />
          {parsePreferredAuctionDate(lot)}
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
  lot: Scrap;
  mode: LotCardMode;
  children: React.ReactNode;
}) {
  const [showModal, setShowModal] = useState(false);

  if (mode === "page") {
    return <Link href={`/lot/${lot.id}`}>{children}</Link>;
  }

  if (mode === "new-page") {
    return (
      <Link href={`/lot/${lot.id}`} target="_blank">
        {children}
      </Link>
    );
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

export function LotCardContent({
  lot,
  mode,
}: {
  lot: Scrap;
  mode: LotCardMode;
}) {
  return (
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
  );
}

export default function LotCard({
  lot,
  mode,
}: {
  lot: Scrap;
  mode: "page" | "modal";
}) {
  return (
    <Card className="cursor-pointer hover:bg-gray-50">
      <LotCardContent lot={lot} mode={mode} />
    </Card>
  );
}
