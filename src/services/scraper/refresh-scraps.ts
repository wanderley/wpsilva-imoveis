"use server";

import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { getScraper } from "@/services/scraper/scrapers";
import { inArray } from "drizzle-orm";
import { Page } from "puppeteer";

export async function refreshScraps(
  scraperID: string,
  page: Page,
): Promise<void> {
  console.info(`[${scraperID}] Refreshing scraps`);
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }

  try {
    const urls = [...new Set(await scraper.search(page))];
    const existingURLs = new Set(
      (
        await db
          .select({ url: scrapsTable.url })
          .from(scrapsTable)
          .where(inArray(scrapsTable.url, urls))
          .execute()
      ).map((r) => r.url),
    );
    console.info(
      `[${scraperID}] ${urls.length} lots found: ${urls.length - existingURLs.size} new, ${existingURLs.size} existing`,
    );
    for (const url of urls) {
      if (existingURLs.has(url)) {
        continue;
      }
      await db
        .insert(scrapsTable)
        .values({
          scraper_id: scraperID,
          url,
          fetch_status: "not-fetched",
        })
        .execute();
    }
  } catch (error) {
    throw new Error(`Error refreshing scraps for ${scraperID}`, {
      cause: error,
    });
  }
}
