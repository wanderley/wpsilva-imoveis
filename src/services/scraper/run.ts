import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { config } from "dotenv";
import { and, eq, gte, or } from "drizzle-orm";

import { scrapers } from ".";
import { refreshScraps, updateScrap } from "./actions";

config({ path: ".env" });
config({ path: ".env.local" });

async function updateAllScraps(scraperID?: string) {
  console.log("Starting to update all scraps...");

  for (const scraper of scrapers) {
    if (scraperID && scraper.url !== scraperID) {
      continue;
    }
    try {
      console.log(`Refreshing scraps for scraper: ${scraper.url}`);
      await refreshScraps(scraper.url);

      const scrapsToUpdate = await db
        .select({ url: scrapsTable.url })
        .from(scrapsTable)
        .where(
          and(
            eq(scrapsTable.scraper_id, scraper.url),
            or(
              eq(scrapsTable.fetch_status, "not-fetched"),
              gte(scrapsTable.first_auction_date, new Date()),
              gte(scrapsTable.second_auction_date, new Date()),
            ),
          ),
        )
        .execute();

      console.log(
        `Updating ${scrapsToUpdate.length} scraps for scraper: ${scraper.url}`,
      );

      for (const scrap of scrapsToUpdate) {
        try {
          await updateScrap(scraper.url, scrap.url);
          console.log(`Updated scrap: ${scrap.url}`);
        } catch (error) {
          console.error(`Error updating scrap ${scrap.url}:`, error);
        }
      }
    } catch (error) {
      console.error(`Can't refresh scrapper: ${scraper.url}`);
      console.error(error);
    }
  }
  console.log("Finished updating all scraps.");
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
