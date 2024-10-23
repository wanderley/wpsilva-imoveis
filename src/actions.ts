"use server";

import { db } from "@/db/index";
import { scrapFilesTable, scrapsTable } from "@/db/schema";
import { refreshScraps, updateScrap } from "@/scraper/actions";
import { eq } from "drizzle-orm";

export async function getScraps(scraperID: string) {
  return await db
    .select()
    .from(scrapsTable)
    .where(eq(scrapsTable.scraper_id, scraperID));
}

export async function getScrapDetails(scrapId: number) {
  const result = await db
    .select({
      scrap: scrapsTable,
      documents: scrapFilesTable,
    })
    .from(scrapsTable)
    .leftJoin(scrapFilesTable, eq(scrapsTable.id, scrapFilesTable.scrap_id))
    .where(eq(scrapsTable.id, scrapId));

  if (result.length === 0) return null;

  const scrap = result[0].scrap;
  const documents = result.map((r) => r.documents).filter(Boolean);

  return { ...scrap, documents };
}

export { refreshScraps, updateScrap };
