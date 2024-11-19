"use server";

import { Scrap } from "@/db/schema";
import {
  ScrapStatus,
  fetchScrapersMetrics,
  fetchScrapsByStatus,
} from "@/features/auction/scraper/repository";

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
