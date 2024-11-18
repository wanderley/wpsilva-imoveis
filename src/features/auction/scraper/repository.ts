"use server";

import { db } from "@/db";
import { scrapAnalysesTable, scrapsTable } from "@/db/schema";
import {
  SQLWrapper,
  and,
  asc,
  count,
  eq,
  isNotNull,
  isNull,
  sql,
  sum,
} from "drizzle-orm";

import { PREFERRED_AUCTION_DATE_FIELD } from "../scrap/repository";

export async function fetchScrapersMetrics(filters?: SQLWrapper[]) {
  const monthField = sql<string>`DATE_FORMAT(${PREFERRED_AUCTION_DATE_FIELD}, '%Y-%m')`;
  const [monthlyLots, counters] = await Promise.all([
    db
      .select({
        scraper_id: scrapsTable.scraper_id,
        month: monthField,
        lots: count(),
      })
      .from(scrapsTable)
      .where(and(isNotNull(monthField), filters ? and(...filters) : undefined))
      .groupBy(monthField, scrapsTable.scraper_id)
      .orderBy(asc(monthField), asc(scrapsTable.scraper_id)),
    db
      .select({
        scraper_id: scrapsTable.scraper_id,
        totalLots: count(),
        successLots: sum(eq(scrapsTable.fetch_status, "fetched")).mapWith(
          Number,
        ),
        failedLots: sum(eq(scrapsTable.fetch_status, "failed")).mapWith(Number),
        incompleteLots: sum(
          sql`CASE WHEN 
            (
              ${isNull(scrapsTable.first_auction_date)} AND
              ${isNull(scrapsTable.second_auction_date)}
            ) OR
            ${isNull(scrapsTable.edital_link)} OR
            ${isNull(scrapsTable.matricula_link)} OR
            ${isNull(scrapsTable.address)} OR
            ${isNull(scrapsTable.case_number)} OR
            ${isNull(scrapsTable.case_link)} OR
            ${isNull(scrapsTable.bid)} OR
            ${isNull(scrapsTable.appraisal)}
          THEN 1 ELSE 0 END`,
        ).mapWith(Number),
        lotsWithoutAnalysis: sum(
          eq(
            db.$count(
              scrapAnalysesTable,
              eq(scrapsTable.id, scrapAnalysesTable.scrap_id),
            ),
            0,
          ),
        ).mapWith(Number),
        notFetchedLots: sum(
          eq(scrapsTable.fetch_status, "not-fetched"),
        ).mapWith(Number),
      })
      .from(scrapsTable)
      .where(filters ? and(...filters) : undefined)
      .groupBy(scrapsTable.scraper_id),
  ]);

  const { accCounters, countersByScraperId } = counters.reduce(
    (acc, metric) => {
      acc.countersByScraperId[metric.scraper_id] = {
        totalLots: metric.totalLots,
        successLots: metric.successLots,
        failedLots: metric.failedLots,
        incompleteLots: metric.incompleteLots,
        lotsWithoutAnalysis: metric.lotsWithoutAnalysis,
        notFetchedLots: metric.notFetchedLots,
      };

      acc.accCounters.totalLots += metric.totalLots;
      acc.accCounters.successLots += metric.successLots;
      acc.accCounters.failedLots += metric.failedLots;
      acc.accCounters.incompleteLots += metric.incompleteLots;
      acc.accCounters.lotsWithoutAnalysis += metric.lotsWithoutAnalysis;
      acc.accCounters.notFetchedLots += metric.notFetchedLots;

      return acc;
    },
    {
      accCounters: {
        totalLots: 0,
        successLots: 0,
        failedLots: 0,
        incompleteLots: 0,
        lotsWithoutAnalysis: 0,
        notFetchedLots: 0,
      },
      countersByScraperId: {} as Record<
        string,
        {
          totalLots: number;
          successLots: number;
          failedLots: number;
          incompleteLots: number;
          lotsWithoutAnalysis: number;
          notFetchedLots: number;
        }
      >,
    },
  );

  const timeseries: ({ month: string } | { [key: string]: number })[] =
    Object.entries(
      monthlyLots.reduce(
        (acc, { month, scraper_id, lots }) => {
          if (!acc[month]) {
            acc[month] = {};
          }
          acc[month][scraper_id] = lots;
          return acc;
        },
        {} as Record<string, Record<string, number>>,
      ),
    )
      .map(([month, lots]) => ({
        month,
        ...lots,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

  return {
    accCounters,
    countersByScraperId,
    timeseries,
    scraperIDs: Array.from(
      new Set(counters.map((metric) => metric.scraper_id)),
    ).sort((a, b) => a.localeCompare(b)),
  };
}
