"use server";

import { findScrapByID } from "@/features/auction/scrap/repository";
import { fetchScrapFromSource } from "@/services/scraper/actions";
import { launchBrowser, newPage } from "@/services/scraper/lib/puppeteer";

export async function updateScrapFromSource(scrapID: number): Promise<void> {
  const scrap = await findScrapByID(scrapID);
  if (scrap === undefined) {
    throw new Error(`Scrap ${scrapID} not found`);
  }
  const browser = await launchBrowser();
  const page = await newPage(browser);
  try {
    await fetchScrapFromSource(scrap.scraper_id, scrap.url, page);
  } catch (error) {
    throw new Error("Failed to update scrap from source", {
      cause: error,
    });
  } finally {
    await browser.close();
  }
}
