"use server";

import { Scrap, scrapProfitTable, scrapsTable } from "@/db/schema";
import {
  GROSS_DISCOUNT_FIELD,
  PREFERRED_AUCTION_DATE_FIELD,
  findScraps,
} from "@/features/auction/scrap/repository";
import {
  SQLWrapper,
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  notInArray,
  sql,
} from "drizzle-orm";

export type LotsFilters = {
  min: string;
  max: string;
  phase: "interesting" | "pendingReview" | "";
  active: "0" | "1" | "";
  auctionStatus: "available" | "unavailable" | "all";
  profitMin: "10" | "20" | "30" | "40" | "";
};

export type Lot = Pick<
  Scrap,
  | "id"
  | "name"
  | "address"
  | "bid"
  | "appraisal"
  | "auction_status"
  | "files"
  | "profit"
  | "preferred_auction_date"
>;

export async function getLotsByFilter(filters: LotsFilters): Promise<Lot[]> {
  const scrapConditions: SQLWrapper[] = [];
  const profitConditions: SQLWrapper[] = [];
  if (filters.min !== "") {
    scrapConditions.push(gte(scrapsTable.bid, parseFloat(filters.min)));
  }
  if (filters.max !== "") {
    scrapConditions.push(lte(scrapsTable.bid, parseFloat(filters.max)));
  }
  if (filters.profitMin !== "") {
    profitConditions.push(
      gte(scrapProfitTable.lucro_percentual, parseFloat(filters.profitMin)),
    );
  }
  switch (filters.active) {
    case "0":
      scrapConditions.push(lt(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`));
      break;
    case "":
    case "1":
      scrapConditions.push(
        gte(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`),
      );
      break;
  }
  switch (filters.phase) {
    case "interesting":
      scrapConditions.push(eq(scrapsTable.is_interesting, 1));
      break;
    case "pendingReview":
      scrapConditions.push(isNull(scrapsTable.is_interesting));
      break;
  }
  switch (filters.auctionStatus) {
    case "available":
      scrapConditions.push(
        inArray(scrapsTable.auction_status, [
          "waiting-to-start",
          "open-for-bids",
        ]),
      );
      break;
    case "unavailable":
      scrapConditions.push(
        notInArray(scrapsTable.auction_status, [
          "waiting-to-start",
          "open-for-bids",
        ]),
      );
      break;
  }

  const scraps = await findScraps({
    scrap: {
      where: and(eq(scrapsTable.fetch_status, "fetched"), ...scrapConditions),
      orderBy: [asc(PREFERRED_AUCTION_DATE_FIELD), desc(GROSS_DISCOUNT_FIELD)],
    },
    profit: {
      where: and(...profitConditions),
    },
  });

  return scraps.map((scrap) => ({
    id: scrap.id,
    name: scrap.name,
    address: scrap.address,
    bid: scrap.bid,
    appraisal: scrap.appraisal,
    auction_status: scrap.auction_status,
    files: scrap.files,
    profit: scrap.profit,
    preferred_auction_date: scrap.preferred_auction_date,
  }));
}
