import { db } from "@/db";
import { Scrap, scrapAnalysesTable, scrapsTable } from "@/db/schema";
import {
  GROSS_DISCOUNT_FIELD,
  PREFERRED_AUCTION_BID_FIELD,
  PREFERRED_AUCTION_DATE_FIELD,
} from "@/models/scraps/actions";
import { desc, eq } from "drizzle-orm";

export async function getAllScrapsByScrapperID(
  scraperID: string,
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
        orderBy: [desc(scrapAnalysesTable.created_at)],
      },
      profit: true,
    },
    where: eq(scrapsTable.scraper_id, scraperID),
    orderBy: [desc(scrapsTable.created_at)],
  });
}
