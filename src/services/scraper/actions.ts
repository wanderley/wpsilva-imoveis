"use server";

import { db } from "@/db";
import {
  scrapAnalysesTable,
  scrapFilesTable,
  scrapProfitTable,
  scrapsTable,
} from "@/db/schema";
import { findScrapByID } from "@/features/auction/scrap/repository";
import { updateProfit } from "@/models/scraps/helpers";
import { getScraper } from "@/services/scraper";
import { Lot, Scraper } from "@/services/scraper/scraper";
import { and, count, eq, inArray } from "drizzle-orm";
import puppeteer, { Page } from "puppeteer";

import { updateAnalysis } from "../analyser/actions";

export async function refreshScraps(scraperID: string): Promise<void> {
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }
  const browser = await puppeteer.launch({
    // TODO: Remove this once we have a proper way to run the scraper
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
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
    status: await tryFetchField(scraper.status),
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
    laudoLink: await tryFetchField(scraper.laudoLink),
    matriculaLink: await tryFetchField(scraper.matriculaLink),
    editalLink: await tryFetchField(scraper.editalLink),
  };
  if (lot.bid === undefined) {
    if (
      lot.firstAuctionBid !== undefined &&
      lot.firstAuctionDate !== undefined &&
      new Date(lot.firstAuctionDate) >= new Date()
    ) {
      lot.bid = lot.firstAuctionBid;
    } else if (
      lot.secondAuctionBid !== undefined &&
      lot.secondAuctionDate !== undefined &&
      new Date(lot.secondAuctionDate) >= new Date()
    ) {
      lot.bid = lot.secondAuctionBid || lot.firstAuctionBid;
    }
  }
  return lot;
}

export async function fetchScrapFromSource(
  scraperID: string,
  url: string,
): Promise<void> {
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }
  const scrapID = await getScrapID(scraperID, url);
  const browser = await puppeteer.launch({
    // TODO: Remove this once we have a proper way to run the scraper
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
await page.setUserAgent(
    // This should dodge cloudflare bot protection
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  );
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    await page.goto(url);
    await page.waitForNetworkIdle();
    let scrapData;
    try {
      scrapData = await scrapLink(scraper, page);
    } catch (_) {
      scrapData = null;
    }
    if (!scrapData) {
      await db
        .update(scrapsTable)
        .set({ fetch_status: "failed" })
        .where(eq(scrapsTable.id, scrapID))
        .execute();
    } else if (scrapData) {
      await db
        .update(scrapsTable)
        .set({
          auction_status: scrapData.status ?? "unknown",
          name: scrapData.name,
          fetch_status: "fetched",
          address: scrapData.address,
          description: scrapData.description,
          case_number: scrapData.caseNumber,
          case_link: scrapData.caseLink,
          bid: scrapData.bid,
          appraisal: scrapData.appraisal,
          first_auction_date: scrapData.firstAuctionDate,
          first_auction_bid: scrapData.firstAuctionBid,
          second_auction_date: scrapData.secondAuctionDate,
          second_auction_bid: scrapData.secondAuctionBid,
          laudo_link: scrapData.laudoLink,
          matricula_link: scrapData.matriculaLink,
          edital_link: scrapData.editalLink,
        })
        .where(
          and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
        )
        .execute();

      // Remove all existing files for this scrap
      await db
        .delete(scrapFilesTable)
        .where(eq(scrapFilesTable.scrap_id, scrapID))
        .execute();

      // Insert new images
      for (const imageUrl of scrapData.images) {
        await db
          .insert(scrapFilesTable)
          .values({
            scrap_id: scrapID,
            file_type: "jpg",
            url: imageUrl,
          })
          .execute();
      }
      await maybeUpdateAnalysis(scrapID);
      await maybeUpdateProfit(scrapID);
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

async function getScrapID(scraperID: string, url: string): Promise<number> {
  const scrap = await db.query.scrapsTable.findFirst({
    where: and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
  });
  if (!scrap) {
    throw new Error(`Scrap ${url} not found`);
  }
  return scrap.id;
}

async function maybeUpdateAnalysis(scrapID: number): Promise<void> {
  const { analysesCount } = (
    await db
      .select({ analysesCount: count() })
      .from(scrapAnalysesTable)
      .where(eq(scrapAnalysesTable.scrap_id, scrapID))
      .execute()
  )[0];
  // If no analysis exists, create one
  if (analysesCount === 0) {
    await updateAnalysis(scrapID, "gpt-4o-mini");
  }
}

async function maybeUpdateProfit(scrapID: number): Promise<void> {
  const scrap = await findScrapByID(scrapID);
  if (!scrap) {
    return;
  }
  let profit = await db.query.scrapProfitTable.findFirst({
    where: eq(scrapProfitTable.scrap_id, scrapID),
  });
  if (!profit) {
    await db.insert(scrapProfitTable).values({ scrap_id: scrapID }).execute();
    profit = (await db.query.scrapProfitTable.findFirst({
      where: eq(scrapProfitTable.scrap_id, scrapID),
    }))!;
  }

  let valorVenda = profit.valor_venda;
  if (profit.status === "default-values") {
    valorVenda = scrap.appraisal ?? profit.valor_venda;
  }
  profit = updateProfit({
    ...profit,
    valor_arrematacao: scrap.preferred_auction_bid ?? profit.valor_arrematacao,
    valor_venda: valorVenda,
  });

  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.scrap_id, scrapID))
    .execute();
}
