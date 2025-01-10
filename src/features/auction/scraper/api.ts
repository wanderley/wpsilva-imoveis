"use server";

import { Scrap } from "@/db/schema";
import {
  ScrapStatus,
  fetchScrapersMetrics,
  fetchScrapsByStatus,
} from "@/features/auction/scraper/repository";
import { refreshScraps } from "@/services/scraper/actions";
import { launchBrowser, newPage } from "@/services/scraper/lib/puppeteer";

export async function getAllScrapsByScrapperID(
  scraperID: string,
  status?: ScrapStatus,
): Promise<Scrap[]> {
  return await fetchScrapsByStatus(scraperID, status);
}

export async function getReport(): Promise<{
  summary: {
    accumulated: ReportStatusTotals;
    byScraperID: Record<string, ReportStatusTotals>;
  };
  timeseries: ReportMonthlyLots[];
  metadata: ReportMetadata;
}> {
  const metrics = await fetchScrapersMetrics();
  return {
    summary: {
      accumulated: metrics.accCounters,
      byScraperID: metrics.countersByScraperId,
    },
    timeseries: metrics.timeseries,
    metadata: {
      scraperIDs: metrics.scraperIDs,
      lastUpdated: new Date().toISOString(),
    },
  };
}

export async function checkNewScraps(scraperID: string): Promise<void> {
  const browser = await launchBrowser([scraperID]);
  const page = await newPage(browser);
  try {
    await refreshScraps(scraperID, page);
  } catch (error) {
    throw new Error(`Failed to check for new scraps from ${scraperID}`, {
      cause: error,
    });
  } finally {
    await browser.close();
  }
}

export type ReportStatusTotals = {
  totalLots: number;
  successLots: number;
  failedLots: number;
  incompleteLots: number;
  lotsWithoutAnalysis: number;
  notFetchedLots: number;
};

export type ReportMonthlyLots = { month: string } | { [key: string]: number };

export type ReportMetadata = {
  scraperIDs: string[];
  lastUpdated: string;
};
