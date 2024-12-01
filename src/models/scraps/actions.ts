"use server";

import { db } from "@/db/index";
import { Scrap, ScrapProfit, scrapProfitTable, scrapsTable } from "@/db/schema";
import {
  GROSS_DISCOUNT_FIELD,
  PREFERRED_AUCTION_DATE_FIELD,
  findScrapByID,
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

export async function getScrapDetails(
  scrapId: number,
): Promise<Scrap | undefined> {
  return await findScrapByID(scrapId);
}

export async function saveScrap(scrap: Scrap): Promise<void> {
  await db.update(scrapsTable).set(scrap).where(eq(scrapsTable.id, scrap.id));
}

async function getLots(extraWhere?: SQLWrapper): Promise<Scrap[]> {
  return await findScraps({
    scrap: {
      where: and(
        eq(scrapsTable.fetch_status, "fetched"),
        gte(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`),
        extraWhere,
      ),
      orderBy: [asc(PREFERRED_AUCTION_DATE_FIELD), desc(GROSS_DISCOUNT_FIELD)],
    },
  });
}

export async function getPendingReviewLots(): Promise<Scrap[]> {
  return await getLots(isNull(scrapsTable.is_interesting));
}

export async function getInterestingLots(): Promise<Scrap[]> {
  return await getLots(eq(scrapsTable.is_interesting, 1));
}

export type SearchLotsFilters = {
  min: string;
  max: string;
  phase: "interesting" | "pendingReview" | "";
  active: "0" | "1" | "";
  auctionStatus: "available" | "unavailable" | "all";
  profitMin: "10" | "20" | "30" | "40" | "";
};

export async function searchLots(filters: SearchLotsFilters): Promise<Scrap[]> {
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

  return await findScraps({
    scrap: {
      where: and(eq(scrapsTable.fetch_status, "fetched"), ...scrapConditions),
      orderBy: [asc(PREFERRED_AUCTION_DATE_FIELD), desc(GROSS_DISCOUNT_FIELD)],
    },
    profit: {
      where: and(...profitConditions),
    },
  });
}

export async function saveScrapProfit(profit: ScrapProfit) {
  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.id, profit.id));
}
