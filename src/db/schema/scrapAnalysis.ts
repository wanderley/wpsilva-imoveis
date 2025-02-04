import { createdAt } from "@/db/schema/lib/common-fields";
import { scrapsTable } from "@/db/schema/scrap";
import { Schema } from "@/services/analyser/schema";
import { relations } from "drizzle-orm";
import { int, json, mysqlEnum, mysqlTable, text } from "drizzle-orm/mysql-core";

export const scrapAnalysesTable = mysqlTable("scrap_analyses", {
  id: int().primaryKey().autoincrement(),
  scrap_id: int().references(() => scrapsTable.id, { onDelete: "cascade" }),
  model: mysqlEnum(["gpt-4o", "gpt-4o-mini"]).notNull(),
  prompt: text("prompt").notNull(),
  response: json("response").$type<Schema>().notNull(),
  response_raw: text("response_raw").notNull(),
  created_at: createdAt,
});

export const scrapAnalysesRelations = relations(
  scrapAnalysesTable,
  ({ one }) => ({
    scrap: one(scrapsTable, {
      fields: [scrapAnalysesTable.scrap_id],
      references: [scrapsTable.id],
    }),
  }),
);
