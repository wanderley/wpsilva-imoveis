"use server";

import { db } from "@/db/index";
import {
  Scrap,
  ScrapProfit,
  scrapAnalysesTable,
  scrapProfitTable,
  scrapsTable,
} from "@/db/schema";
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

const PREFERRED_AUCTION_DATE_FIELD = sql<string | null>`(CASE 
  WHEN ${scrapsTable.second_auction_date} IS NOT NULL THEN ${scrapsTable.second_auction_date}
  ELSE ${scrapsTable.first_auction_date}
END)`;
const PREFERRED_AUCTION_BID_FIELD = sql<number | null>`(CASE 
  WHEN ${scrapsTable.first_auction_date} < CURRENT_DATE THEN ${scrapsTable.bid}
  WHEN ${scrapsTable.second_auction_date} IS NOT NULL THEN ${scrapsTable.second_auction_bid}
  ELSE ${scrapsTable.first_auction_bid}
END)`;
const GROSS_DISCOUNT_FIELD = sql<number>`((
  ${scrapsTable.appraisal} - (
    CASE
      WHEN ${PREFERRED_AUCTION_DATE_FIELD} >= CURRENT_DATE THEN
        ${PREFERRED_AUCTION_BID_FIELD}
      ELSE COALESCE(${scrapsTable.bid}, 0)
    END
  )
) / ${scrapsTable.appraisal} * 100)`;

export async function getScraps(scraperID: string): Promise<Scrap[]> {
  return await db.query.scrapsTable.findMany({
    extras: {
      preferred_auction_date: PREFERRED_AUCTION_DATE_FIELD.as(
        "preferred_auction_date",
      ),
      preferred_auction_bid: PREFERRED_AUCTION_BID_FIELD.as(
        "preferred_auction_bid",
      ),
      gross_discount: GROSS_DISCOUNT_FIELD.as("gross_discount"),
    },
    with: {
      files: true,
      analyses: {
        orderBy: [desc(scrapAnalysesTable.created_at)],
      },
      profit: true,
    },
    where: eq(scrapsTable.scraper_id, scraperID),
  });
}

export async function getScrapDetails(
  scrapId: number,
): Promise<Scrap | undefined> {
  return await db.query.scrapsTable.findFirst({
    extras: {
      preferred_auction_date: PREFERRED_AUCTION_DATE_FIELD.as(
        "preferred_auction_date",
      ),
      preferred_auction_bid: PREFERRED_AUCTION_BID_FIELD.as(
        "preferred_auction_bid",
      ),
      gross_discount: GROSS_DISCOUNT_FIELD.as("gross_discount"),
    },
    with: {
      files: true,
      analyses: {
        orderBy: [desc(scrapAnalysesTable.created_at)],
      },
      profit: true,
    },
    where: eq(scrapsTable.id, scrapId),
  });
}

export async function saveScrap(scrap: Scrap): Promise<void> {
  await db.update(scrapsTable).set(scrap).where(eq(scrapsTable.id, scrap.id));
}

export async function getLots(extraWhere?: SQLWrapper): Promise<Scrap[]> {
  return await db.query.scrapsTable.findMany({
    extras: {
      preferred_auction_date: PREFERRED_AUCTION_DATE_FIELD.as(
        "preferred_auction_date",
      ),
      preferred_auction_bid: PREFERRED_AUCTION_BID_FIELD.as(
        "preferred_auction_bid",
      ),
      gross_discount: GROSS_DISCOUNT_FIELD.as("gross_discount"),
    },
    with: {
      files: true,
      analyses: {
        orderBy: [desc(scrapAnalysesTable.created_at)],
      },
      profit: true,
    },
    where: and(
      eq(scrapsTable.fetch_status, "fetched"),
      gte(PREFERRED_AUCTION_DATE_FIELD, sql`CURRENT_DATE`),
      extraWhere,
    ),
    orderBy: [asc(PREFERRED_AUCTION_DATE_FIELD), desc(GROSS_DISCOUNT_FIELD)],
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
      preferred_auction_date: PREFERRED_AUCTION_DATE_FIELD.as(
        "preferred_auction_date",
      ),
      preferred_auction_bid: PREFERRED_AUCTION_BID_FIELD.as(
        "preferred_auction_bid",
      ),
      gross_discount: GROSS_DISCOUNT_FIELD.as("gross_discount"),
    },
    with: {
      files: true,
      analyses: {
        orderBy: [desc(scrapAnalysesTable.created_at)],
      },
      profit: true,
    },
    where: and(eq(scrapsTable.fetch_status, "fetched"), ...conditions),
    orderBy: [asc(nextAuctionDate), desc(discount)],
  });
}

export async function saveScrapProfit(profit: ScrapProfit) {
  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.id, profit.id));
}
