import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { and, eq, gte, or } from "drizzle-orm";

import { scrapers } from ".";
import { fetchScrapFromSource, refreshScraps } from "./actions";

async function updateAllScraps(scraperID?: string) {
  console.info("Starting to update all scraps...");

  for (const scraper of scrapers) {
    if (scraperID && scraper.url !== scraperID) {
      continue;
    }
    try {
      await refreshScraps(scraper.url);

      const scrapsToUpdate = await db
        .select({ id: scrapsTable.id, url: scrapsTable.url })
        .from(scrapsTable)
        .where(
          and(
            eq(scrapsTable.scraper_id, scraper.url),
            or(
              eq(scrapsTable.fetch_status, "not-fetched"),
              eq(scrapsTable.fetch_status, "failed"),
              gte(scrapsTable.first_auction_date, new Date()),
              gte(scrapsTable.second_auction_date, new Date()),
            ),
          ),
        )
        .execute();

      console.info(
        `[${scraper.url}] Found ${scrapsToUpdate.length} scraps to update`,
      );

      for (const scrap of scrapsToUpdate) {
        try {
          await fetchScrapFromSource(scraper.url, scrap.url);
          console.info(`[${scraper.url}] Updated scrap: ${scrapUrl(scrap.id)}`);
        } catch (error) {
          console.error(
            `[${scraper.url}] Failed to update scrap: ${scrapUrl(scrap.id)}`,
          );
          console.error(error);
        }
      }
    } catch (error) {
      console.error(`[${scraper.url}] Can't refresh scrapper`);
      console.error(error);
    }
  }
  console.info("Finished updating all scraps.");
}

function scrapUrl(scrapID: number): string {
  const prefix = process.env.AUTH_URL ?? `http://localhost:3000`;
  return `${prefix}/lot/${scrapID}`;
}

updateAllScraps(process.argv[2])
  .catch((error) => {
    console.error("Error running updateAllScraps:", error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Closing database connection.");
    await db.$client.end();
    process.exit(0);
  });
