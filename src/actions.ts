"use server";

import { db } from "@/db/index";
import { ScrapWithFiles, scrapsTable } from "@/db/schema";
import { refreshScraps, updateScrap } from "@/scraper/actions";
import { eq } from "drizzle-orm";

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

export { refreshScraps, updateScrap };

export async function getPendingReviewLots(): Promise<ScrapWithFiles[]> {
  return await db.query.scrapsTable.findMany({
    with: {
      files: true,
    },
    where: eq(scrapsTable.fetch_status, "fetched"),
  });
}
