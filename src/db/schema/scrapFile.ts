import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { scrapsTable } from "@/db/schema/scrap";
import { relations } from "drizzle-orm";
import { int, mysqlEnum, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const scrapFilesTable = mysqlTable("scrap_files", {
  id: int().primaryKey().autoincrement(),
  scrap_id: int().references(() => scrapsTable.id, { onDelete: "cascade" }),
  file_type: mysqlEnum(["jpg", "pdf"]).notNull(),
  url: varchar({ length: 767 }).notNull(),
  created_at: createdAt,
  updated_at: updatedAt,
});

export const scrapFilesRelations = relations(scrapFilesTable, ({ one }) => ({
  scrap: one(scrapsTable, {
    fields: [scrapFilesTable.scrap_id],
    references: [scrapsTable.id],
  }),
}));
