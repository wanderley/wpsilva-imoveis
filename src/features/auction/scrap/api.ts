"use server";

import {
  getScrapScreencastPath,
  getScrapScreenshotPath,
} from "@/features/auction/scrap/helpers.server";
import { findScrapByID } from "@/features/auction/scrap/repository";
import { fetchScrapFromSource } from "@/services/scraper/actions";
import { launchBrowser, newPage } from "@/services/scraper/lib/puppeteer";

export async function updateScrapFromSource(scrapID: number): Promise<void> {
  const scrap = await findScrapByID(scrapID);
  if (scrap === undefined) {
    throw new Error(`Scrap ${scrapID} not found`);
  }
  const browser = await launchBrowser([scrap.scraper_id]);
  const page = await newPage(browser);
  let screencast;
  try {
    screencast = await page.screencast({
      path: getScrapScreencastPath(scrap.id),
      speed: 0.5,
    });
    await fetchScrapFromSource(scrap.scraper_id, scrap.url, page);
  } catch (error) {
    throw new Error("Failed to update scrap from source", {
      cause: error,
    });
  } finally {
    if (screencast) {
      try {
        await screencast.stop();
      } catch (error) {
        console.error("Error stopping screencast", error);
      }
    }
    try {
      await page.screenshot({ path: getScrapScreenshotPath(scrap.id) });
    } catch (error) {
      console.error("Error taking screenshot", error);
    }
    await browser.close();
  }
}
