import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import {
  fetchScrapFromSource,
  refreshScraps,
} from "@/services/scraper/actions";
import { launchBrowser, newPage } from "@/services/scraper/lib/puppeteer";
import { scrapers as scrapersList } from "@/services/scraper/scrapers";
import { program } from "commander";
import { and, desc, eq, gte, or } from "drizzle-orm";

const DAY = 1000 * 60 * 60 * 24;

program
  .command("list")
  .description("List scrappers")
  .action(async () => {
    console.log("Scrapers:");
    console.log(scrapersList.map((scraper) => `- ${scraper.url}`).join("\n"));
    console.log();
  });

program
  .command("fetch")
  .description("Fetch scraps from auctioner website")
  .argument(
    "[scrapers...]",
    "Scrapers to be updated. If not provided, all scrapers will be updated",
  )
  .option("-o, --only-refresh", "Only refresh list of scraps", false)
  .option("--all", "Update all scraps regardless of their fetch status", false)
  .action(
    async (
      scrapers: string[],
      options: { onlyRefresh: boolean; all: boolean },
    ) => {
      scrapers = ensureScrapersAreValid(scrapers);

      for (const scraper of scrapers) {
        await fetch(scraper, options);
      }
    },
  );

async function fetch(
  scraper: string,
  options: { onlyRefresh: boolean; all: boolean },
) {
  const browser = await launchBrowser([scraper]);

  try {
    const searchPage = await newPage(browser);
    await refreshScraps(scraper, searchPage);
    await searchPage.close();
    if (options.onlyRefresh) {
      return;
    }

    const scraps = await getScrapsToUpdate(scraper, options.all);
    console.info(`[${scraper}] Found ${scraps.length} scraps to update`);

    for (const scrap of scraps) {
      const page = await newPage(browser);
      try {
        await fetchScrapFromSource(scraper, scrap.url, page);
        console.info(`[${scraper}] Updated scrap: ${scrapUrl(scrap.id)}`);
      } catch (error) {
        console.error(
          `[${scraper}] Failed to update scrap: ${scrapUrl(scrap.id)}`,
        );
        console.error(error);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

async function getScrapsToUpdate(scraper: string, all: boolean) {
  if (all) {
    return await db
      .select({ id: scrapsTable.id, url: scrapsTable.url })
      .from(scrapsTable)
      .where(eq(scrapsTable.scraper_id, scraper))
      .execute();
  }
  return await db
    .select({ id: scrapsTable.id, url: scrapsTable.url })
    .from(scrapsTable)
    .where(
      and(
        eq(scrapsTable.scraper_id, scraper),
        or(
          eq(scrapsTable.fetch_status, "not-fetched"),
          eq(scrapsTable.fetch_status, "failed"),
          gte(scrapsTable.first_auction_date, new Date(Date.now() - DAY)),
          gte(scrapsTable.second_auction_date, new Date(Date.now() - DAY)),
        ),
      ),
    )
    .orderBy(desc(scrapsTable.updated_at))
    .execute();
}

function ensureScrapersAreValid(scrapers: string[]) {
  // check if scrapers are valid
  const invalidScrapers = scrapers.filter(
    (scraper) => !scrapersList.some((s) => s.url === scraper),
  );
  if (invalidScrapers.length > 0) {
    throw new Error(`Scraper ${invalidScrapers.join(", ")} not found`);
  }
  // if no scrapers are provided, update all scrapers
  if (scrapers.length === 0) {
    scrapers = scrapersList.map((scraper) => scraper.url);
  }
  return scrapers;
}

function scrapUrl(scrapID: number): string {
  const prefix = process.env.AUTH_URL ?? `http://localhost:3000`;
  return `${prefix}/lot/${scrapID}`;
}

program
  .parseAsync()
  .catch((error) => {
    console.error("Error running scraper:", error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Closing database connection.");
    await db.$client.end();
    process.exit(0);
  });
