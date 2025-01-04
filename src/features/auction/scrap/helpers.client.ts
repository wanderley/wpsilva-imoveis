"use client";

import { Scrap } from "@/db/schema";

export function getPreferredAuctionDate(
  lot: Pick<Scrap, "preferred_auction_date">,
) {
  if (!lot.preferred_auction_date) {
    return null;
  }
  // TODO: Drizzle was supposed to provide a Date object, but it's returning a string
  return new Date(lot.preferred_auction_date + "Z");
}
