"use server";

import { Scrap, scrapAnalysesTable, scrapsTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

import { findScraps } from "../scrap/repository";
import { fetchScrapersMetrics } from "./repository";

export async function getAllScrapsByScrapperID(
  scraperID: string,
): Promise<Scrap[]> {
  return await findScraps({
    scrap: {
      where: eq(scrapsTable.scraper_id, scraperID),
      orderBy: [desc(scrapsTable.created_at)],
    },
    analysis: {
      orderBy: [desc(scrapAnalysesTable.created_at)],
    },
  });
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
