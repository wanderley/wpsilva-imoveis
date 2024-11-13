"use client";

import { Scrap } from "@/db/schema";
import { Badge } from "flowbite-react";

export const LotStatusBadge = ({ scrap }: { scrap: Scrap }) => {
  let color = "success";
  let text = "Carregado";
  switch (scrap.fetch_status) {
    case "not-fetched":
      color = "warning";
      text = "Não carregado";
      break;
    case "fetched":
      color = "success";
      text = "Carregado";
      break;
    case "failed":
      color = "failure";
      text = "Falha";
      break;
  }
  return (
    <Badge color={color} className="inline-block">
      {text}
    </Badge>
  );
};
