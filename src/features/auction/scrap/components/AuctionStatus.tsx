import { Badge, BadgeProps } from "@/components/ui/badge";
import { Scrap } from "@/db/schema";
import assertNever from "@/lib/assert-never";

function getText(scrap: Scrap) {
  switch (scrap.auction_status) {
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
      assertNever(scrap.auction_status);
  }
}

function AuctionStatusBadge({ scrap }: { scrap: Scrap }) {
  let color: BadgeProps["variant"] = undefined;
  switch (scrap.auction_status) {
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
      assertNever(scrap.auction_status);
  }
  return <Badge variant={color}>{getText(scrap)}</Badge>;
}

function AuctionStatusText({ scrap }: { scrap: Scrap }) {
  let color = undefined;
  switch (scrap.auction_status) {
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
      assertNever(scrap.auction_status);
  }
  return (
    <span className={`${color} flex items-center mr-1`}>{getText(scrap)}</span>
  );
}

export default function AuctionStatus({
  scrap,
  as = "badge",
}: {
  scrap: Scrap;
  as?: "badge" | "text";
}) {
  if (as == "badge") {
    return <AuctionStatusBadge scrap={scrap} />;
  }
  return <AuctionStatusText scrap={scrap} />;
}
