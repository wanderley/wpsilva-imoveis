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
  isNull,
  lt,
  lte,
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
};

export async function searchLots(filters: SearchLotsFilters): Promise<Scrap[]> {
  const conditions: SQLWrapper[] = [];
  if (filters.min !== "") {
    conditions.push(gte(scrapsTable.bid, parseFloat(filters.min)));
  }
  if (filters.max !== "") {
    conditions.push(lte(scrapsTable.bid, parseFloat(filters.max)));
  }
  switch (filters.active) {
    case "0":
      conditions.push(lt(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`));
      break;
    case "":
    case "1":
      conditions.push(gte(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`));
      break;
  }
  switch (filters.phase) {
    case "interesting":
      conditions.push(eq(scrapsTable.is_interesting, 1));
      break;
    case "pendingReview":
      conditions.push(isNull(scrapsTable.is_interesting));
      break;
  }

  return await findScraps({
    scrap: {
      where: and(eq(scrapsTable.fetch_status, "fetched"), ...conditions),
      orderBy: [asc(PREFERRED_AUCTION_DATE_FIELD), desc(GROSS_DISCOUNT_FIELD)],
    },
  });
}

export async function saveScrapProfit(profit: ScrapProfit) {
  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.id, profit.id));
}
