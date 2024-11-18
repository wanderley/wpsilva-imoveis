import { db } from "@/db";
import { Scrap, scrapAnalysesTable, scrapsTable } from "@/db/schema";
import { SQL, desc, eq, sql } from "drizzle-orm";

type FindScrapsOptions = {
  scrap?: {
    where?: SQL<unknown>;
    orderBy?: SQL<unknown>[];
  };
  analysis?: {
    where?: SQL<unknown>;
    orderBy?: SQL<unknown>[];
  };
};

export const PREFERRED_AUCTION_DATE_FIELD = sql<string | null>`(CASE 
  WHEN ${scrapsTable.second_auction_date} IS NOT NULL THEN ${scrapsTable.second_auction_date}
  ELSE ${scrapsTable.first_auction_date}
END)`;

export const PREFERRED_AUCTION_BID_FIELD = sql<number | null>`(CASE 
  WHEN ${scrapsTable.first_auction_date} < CURRENT_DATE THEN ${scrapsTable.bid}
  WHEN ${scrapsTable.second_auction_date} IS NOT NULL THEN ${scrapsTable.second_auction_bid}
  ELSE ${scrapsTable.first_auction_bid}
END)`;

export const GROSS_DISCOUNT_FIELD = sql<number>`((
  ${scrapsTable.appraisal} - (
    CASE
      WHEN ${PREFERRED_AUCTION_DATE_FIELD} >= CURRENT_DATE THEN
        ${PREFERRED_AUCTION_BID_FIELD}
      ELSE COALESCE(${scrapsTable.bid}, 0)
    END
  )
) / ${scrapsTable.appraisal} * 100)`;

export async function findScraps(
  options?: FindScrapsOptions,
): Promise<Scrap[]> {
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
        where: options?.analysis?.where,
        orderBy: options?.analysis?.orderBy || [
          desc(scrapAnalysesTable.created_at),
        ],
      },
      profit: true,
    },
    where: options?.scrap?.where,
    orderBy: options?.scrap?.orderBy,
  });
}

export async function findScrap(
  options: FindScrapsOptions,
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
        where: options.analysis?.where,
        orderBy: options.analysis?.orderBy || [
          desc(scrapAnalysesTable.created_at),
        ],
      },
      profit: true,
    },
    where: options.scrap?.where,
    orderBy: options.scrap?.orderBy,
  });
}

export async function findScrapByID(
  scrapId: number,
): Promise<Scrap | undefined> {
  return await findScrap({
    scrap: {
      where: eq(scrapsTable.id, scrapId),
    },
  });
}
