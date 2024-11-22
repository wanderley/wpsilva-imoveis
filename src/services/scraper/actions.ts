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
import puppeteer, { Browser, Page } from "puppeteer";

import { updateAnalysis } from "../analyser/actions";

export async function refreshScraps(scraperID: string): Promise<void> {
  console.info(`[${scraperID}] Refreshing scraps`);
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }

  const [browser, page] = await launch();
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
  } finally {
    await browser.close();
  }
}

async function scrapLink(scraper: Scraper, page: Page): Promise<Lot | null> {
  // TODO: Log fields that couldn't be fetched
  async function tryFetchField<T>(
    fieldName: string,
    field: (page: Page) => Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await field(page);
    } catch (error) {
      console.error(
        `Error fetching field ${fieldName}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }
  const name = await tryFetchField("name", scraper.name);
  if (name == undefined) {
    console.error(`[${scraper.url}] Field name not found`);
    return null;
  }
  const address = await tryFetchField("address", scraper.address);
  if (address == undefined) {
    console.error(`[${scraper.url}] Field address not found`);
    return null;
  }
  const lot = {
    name,
    address,
    status: await tryFetchField("status", scraper.status),
    description:
      (await tryFetchField("description", scraper.description)) ||
      "Descrição não encontrada",
    caseNumber: await tryFetchField("caseNumber", scraper.caseNumber),
    caseLink: await tryFetchField("caseLink", scraper.caseLink),
    bid: await tryFetchField("bid", scraper.bid),
    appraisal: await tryFetchField("appraisal", scraper.appraisal),
    firstAuctionDate: await tryFetchField(
      "firstAuctionDate",
      scraper.firstAuctionDate,
    ),
    firstAuctionBid: await tryFetchField(
      "firstAuctionBid",
      scraper.firstAuctionBid,
    ),
    secondAuctionDate: await tryFetchField(
      "secondAuctionDate",
      scraper.secondAuctionDate,
    ),
    secondAuctionBid: await tryFetchField(
      "secondAuctionBid",
      scraper.secondAuctionBid,
    ),
    images: (await tryFetchField("images", scraper.images)) || [],
    laudoLink: await tryFetchField("laudoLink", scraper.laudoLink),
    matriculaLink: await tryFetchField("matriculaLink", scraper.matriculaLink),
    editalLink: await tryFetchField("editalLink", scraper.editalLink),
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
  const [browser, page] = await launch();
  try {
    if (scraper.login) {
      await scraper.login(page);
    }
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

      await maybeUpdateImages(scrapID, scrapData.images);
      await maybeUpdateAnalysis(scrapID);
      await maybeUpdateProfit(scrapID);
    }
  } catch (error) {
    await db
      .update(scrapsTable)
      .set({
        fetch_status: "failed",
      })
      .where(
        and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
      )
      .execute();
    throw new Error(`Failed to fetch scrap ${url}`, {
      cause: error,
    });
  } finally {
    await browser.close();
  }
}

async function launch(): Promise<[Browser, Page]> {
  const browser = await puppeteer.launch({
    // TODO: Remove this once we have a proper way to run the scraper
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  await page.setUserAgent(
    // This should dodge cloudflare bot protection
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  );
  return [browser, page];
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

async function maybeUpdateImages(
  scrapID: number,
  imageUrls: string[],
): Promise<void> {
  // don't update images if scraper failed to fetch them
  if (imageUrls.length === 0) {
    return;
  }

  const count = await db.$count(
    scrapFilesTable,
    and(
      eq(scrapFilesTable.scrap_id, scrapID),
      inArray(scrapFilesTable.url, imageUrls),
    ),
  );
  // don't update images if they are already in the database
  if (count === imageUrls.length) {
    return;
  }

  await db
    .delete(scrapFilesTable)
    .where(eq(scrapFilesTable.scrap_id, scrapID))
    .execute();
  await db
    .insert(scrapFilesTable)
    .values(
      imageUrls.map((imageUrl) => ({
        scrap_id: scrapID,
        file_type: "jpg" as "jpg",
        url: imageUrl,
      })),
    )
    .execute();
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
