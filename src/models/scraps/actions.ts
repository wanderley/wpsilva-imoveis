"use server";

import { db } from "@/db/index";
import { Scrap, ScrapProfit, scrapProfitTable, scrapsTable } from "@/db/schema";
import { findScrapByID } from "@/features/auction/scrap/repository";
import { eq } from "drizzle-orm";

export async function getScrapDetails(
  scrapId: number,
): Promise<Scrap | undefined> {
  return await findScrapByID(scrapId);
}

export async function saveScrap(scrap: Scrap): Promise<void> {
  await db.update(scrapsTable).set(scrap).where(eq(scrapsTable.id, scrap.id));
}

export async function saveScrapProfit(profit: ScrapProfit) {
  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.id, profit.id));
}
