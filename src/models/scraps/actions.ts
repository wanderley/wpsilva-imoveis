"use server";

import { db } from "@/db/index";
import { ScrapWithFiles, scrapsTable } from "@/db/schema";
import {
  SQLWrapper,
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lte,
  sql,
} from "drizzle-orm";

export async function getScraps(scraperID: string): Promise<ScrapWithFiles[]> {
  return await db.query.scrapsTable.findMany({
    with: {
      files: true,
    },
    where: eq(scrapsTable.scraper_id, scraperID),
  });
}

export async function getScrapDetails(
  scrapId: number,
): Promise<ScrapWithFiles | undefined> {
  return await db.query.scrapsTable.findFirst({
    with: {
      files: true,
    },
    where: eq(scrapsTable.id, scrapId),
  });
}

export async function saveScrap(scrap: ScrapWithFiles): Promise<void> {
  await db.update(scrapsTable).set(scrap).where(eq(scrapsTable.id, scrap.id));
}

export async function getLots(extraWhere?: SQLWrapper) {
  const nextAuctionDate = sql<Date | null>`CASE 
      WHEN DATE(${scrapsTable.first_auction_date}) >= CURRENT_DATE THEN DATE(${scrapsTable.first_auction_date})
      WHEN DATE(${scrapsTable.second_auction_date}) >= CURRENT_DATE THEN DATE(${scrapsTable.second_auction_date})
      ELSE NULL
    END`;
  const discount = sql<number>`(${scrapsTable.appraisal} - COALESCE(${scrapsTable.bid}, 0)) / ${scrapsTable.appraisal} * 100`;
  return await db.query.scrapsTable.findMany({
    extras: {
      next_auction_date: nextAuctionDate.as("next_auction_date"),
      discount: discount.as("discount"),
    },
    with: {
      files: true,
    },
    where: and(
      eq(scrapsTable.fetch_status, "fetched"),
      gte(nextAuctionDate, sql`CURRENT_DATE`),
      extraWhere,
    ),
    orderBy: [asc(nextAuctionDate), desc(discount)],
  });
}

export async function getPendingReviewLots(): Promise<ScrapWithFiles[]> {
  return await getLots(isNull(scrapsTable.is_interesting));
}

export async function getInterestingLots(): Promise<ScrapWithFiles[]> {
  return await getLots(eq(scrapsTable.is_interesting, 1));
}

export type SearchLotsFilters = {
  min: string;
  max: string;
  phase: "interesting" | "pendingReview" | "";
  active: "0" | "1" | "";
};

export async function searchLots(
  filters: SearchLotsFilters,
): Promise<ScrapWithFiles[]> {
  const nextAuctionDate = sql<Date | null>`CASE 
      WHEN DATE(${scrapsTable.first_auction_date}) >= CURRENT_DATE THEN DATE(${scrapsTable.first_auction_date})
      WHEN DATE(${scrapsTable.second_auction_date}) >= CURRENT_DATE THEN DATE(${scrapsTable.second_auction_date})
      ELSE NULL
    END`;
  const discount = sql<number>`(${scrapsTable.appraisal} - COALESCE(${scrapsTable.bid}, 0)) / ${scrapsTable.appraisal} * 100`;

  const conditions: SQLWrapper[] = [];
  if (filters.min !== "") {
    conditions.push(gte(scrapsTable.bid, parseFloat(filters.min)));
  }
  if (filters.max !== "") {
    conditions.push(lte(scrapsTable.bid, parseFloat(filters.max)));
  }
  switch (filters.active) {
    case "0":
      conditions.push(isNull(nextAuctionDate));
      break;
    case "":
    case "1":
      conditions.push(gte(nextAuctionDate, sql`CURRENT_DATE`));
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

  return await db.query.scrapsTable.findMany({
    extras: {
      next_auction_date: nextAuctionDate.as("next_auction_date"),
      discount: discount.as("discount"),
    },
    with: {
      files: true,
    },
    where: and(eq(scrapsTable.fetch_status, "fetched"), ...conditions),
    orderBy: [asc(nextAuctionDate), desc(discount)],
  });
}
