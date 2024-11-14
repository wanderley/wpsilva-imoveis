"use server";

import { Scrap, scrapAnalysesTable, scrapsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

import { findScraps } from "../scrap/repository";

export async function getAllScrapsByScrapperID(
  scraperID: string,
): Promise<Scrap[]> {
  return await findScraps({
    scrap: {
      where: eq(scrapsTable.scraper_id, scraperID),
      orderBy: [desc(scrapsTable.created_at)],
    },
    analysis: {
      orderBy: [desc(scrapAnalysesTable.created_at)],
    },
  });
}
