"use server";

import { db } from "@/db";
import { scrapFilesTable, scrapsTable } from "@/db/schema";
import { getScraper } from "@/scraper";
import { parseBrazilianDate } from "@/scraper/parsers";
import { Lot, Scraper } from "@/scraper/scraper";
import { and, eq, inArray } from "drizzle-orm";
import puppeteer from "puppeteer";
import { Page } from "puppeteer";

export async function refreshScraps(scraperID: string): Promise<void> {
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1024 });
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
    console.error("Error refreshing scraps:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapLink(scraper: Scraper, page: Page): Promise<Lot | null> {
  // TODO: Log fields that couldn't be fetched
  async function tryFetchField<T>(
    field: (page: Page) => Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await field(page);
    } catch (error) {
      console.error(`Error fetching field: ${error}`);
      return undefined;
    }
  }
  const name = await tryFetchField(scraper.name);
  if (name == undefined) {
    return null;
  }
  const address = await tryFetchField(scraper.address);
  if (address == undefined) {
    return null;
  }
  const lot = {
    name,
    address,
    description:
      (await tryFetchField(scraper.description)) || "Descrição não encontrada",
    caseNumber: await tryFetchField(scraper.caseNumber),
    caseLink: await tryFetchField(scraper.caseLink),
    bid: await tryFetchField(scraper.bid),
    appraisal: await tryFetchField(scraper.appraisal),
    firstAuctionDate: await tryFetchField(scraper.firstAuctionDate),
    firstAuctionBid: await tryFetchField(scraper.firstAuctionBid),
    secondAuctionDate: await tryFetchField(scraper.secondAuctionDate),
    secondAuctionBid: await tryFetchField(scraper.secondAuctionBid),
    images: (await tryFetchField(scraper.images)) || [],
    laudo_link: await tryFetchField(scraper.laudo_link),
    matricula_link: await tryFetchField(scraper.matricula_link),
    edital_link: await tryFetchField(scraper.edital_link),
  };
  return lot;
}

export async function updateScrap(
  scraperID: string,
  url: string,
): Promise<void> {
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    await page.goto(url);
    let scrapData;
    try {
      scrapData = await scrapLink(scraper, page);
    } catch (_) {
      scrapData = null;
    }
    if (!scrapData) {
      await db
        .update(scrapsTable)
        .set({
          fetch_status: "failed",
        })
        .where(
          and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
        )
        .execute();
    } else if (scrapData) {
      const existingScrap = await db.query.scrapsTable.findFirst({
        where: and(
          eq(scrapsTable.scraper_id, scraperID),
          eq(scrapsTable.url, url),
        ),
      });
      await db
        .update(scrapsTable)
        .set({
          name: scrapData.name,
          fetch_status: "fetched",
          address: scrapData.address,
          description: scrapData.description,
          case_number: scrapData.caseNumber,
          case_link: scrapData.caseLink,
          bid: scrapData.bid,
          appraisal: scrapData.appraisal,
          first_auction_date: parseBrazilianDate(scrapData.firstAuctionDate),
          first_auction_bid: scrapData.firstAuctionBid,
          second_auction_date: parseBrazilianDate(scrapData.secondAuctionDate),
          second_auction_bid: scrapData.secondAuctionBid,
          laudo_link: scrapData.laudo_link,
          matricula_link: scrapData.matricula_link,
          edital_link: scrapData.edital_link,
          valor_arrematacao:
            existingScrap?.valor_arrematacao || scrapData.bid || undefined,
          valor_venda:
            existingScrap?.valor_venda || scrapData.appraisal || undefined,
        })
        .where(
          and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
        )
        .execute();

      // Get the scrap ID
      const scrapResult = await db
        .select({ id: scrapsTable.id })
        .from(scrapsTable)
        .where(
          and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
        )
        .limit(1)
        .execute();

      if (scrapResult.length > 0) {
        const scrapId = scrapResult[0].id;

        // Remove all existing files for this scrap
        await db
          .delete(scrapFilesTable)
          .where(eq(scrapFilesTable.scrap_id, scrapId))
          .execute();

        // Insert new images
        for (const imageUrl of scrapData.images) {
          await db
            .insert(scrapFilesTable)
            .values({
              scrap_id: scrapId,
              file_type: "jpg",
              url: imageUrl,
            })
            .execute();
        }
      }
    }
  } catch (error) {
    console.error("Error updating scrap:", error);
    await db
      .update(scrapsTable)
      .set({
        fetch_status: "failed",
      })
      .where(
        and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
      )
      .execute();
    throw error;
  } finally {
    await browser.close();
  }
}
