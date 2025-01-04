import { Badge, BadgeProps } from "@/components/ui/badge";
import { Scrap } from "@/db/schema";
import assertNever from "@/lib/assert-never";

function getText(status: Scrap["auction_status"]) {
  switch (status) {
    case "waiting-to-start":
      return "Aguardando Início";
    case "open-for-bids":
      return "Aberto para Lance";
    case "sold":
      return "Arrematado";
    case "closed":
      return "Fechado";
    case "impaired":
      return "Leilão prejudicado";
    case "suspended":
      return "Suspenso";
    case "unknown":
    case null:
      return "Desconhecido";
    default:
      assertNever(status);
  }
}

function AuctionStatusBadge({ status }: { status: Scrap["auction_status"] }) {
  let color: BadgeProps["variant"] = undefined;
  switch (status) {
    case "waiting-to-start":
      color = "warning";
      break;
    case "open-for-bids":
      color = "success";
      break;
    case "sold":
      color = "destructive";
      break;
    case "closed":
      color = "destructive";
      break;
    case "impaired":
      color = "destructive";
      break;
    case "suspended":
      color = "destructive";
      break;
    case "unknown":
    case null:
      color = "default";
      break;
    default:
      assertNever(status);
  }
  return <Badge variant={color}>{getText(status)}</Badge>;
}

function AuctionStatusText({ status }: { status: Scrap["auction_status"] }) {
  let color = undefined;
  switch (status) {
    case "waiting-to-start":
      color = "text-yellow-600";
      break;
    case "open-for-bids":
      color = "text-green-600";
      break;
    case "sold":
      color = "text-red-600";
      break;
    case "closed":
      color = "text-red-600";
      break;
    case "impaired":
      color = "text-red-600";
      break;
    case "suspended":
      color = "text-red-600";
      break;
    case "unknown":
    case null:
      color = "text-gray-600";
      break;
    default:
      assertNever(status);
  }
  return (
    <span className={`${color} flex items-center mr-1`}>{getText(status)}</span>
  );
}

export default function AuctionStatus({
  scrap,
  as = "badge",
}: {
  scrap: Pick<Scrap, "auction_status">;
  as?: "badge" | "text";
}) {
  if (as == "badge") {
    return <AuctionStatusBadge status={scrap.auction_status} />;
  }
  return <AuctionStatusText status={scrap.auction_status} />;
}
