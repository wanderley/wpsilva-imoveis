import { relations, sql } from "drizzle-orm";
import {
  datetime,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const scrapsTable = mysqlTable("scraps", {
  id: int().primaryKey().autoincrement(),
  scraper_id: varchar({ length: 1020 }).notNull(),
  name: varchar({ length: 1020 }),
  url: varchar({ length: 1020 }).notNull(),
  address: varchar({ length: 1020 }),
  description: text(),
  case_number: varchar({ length: 255 }),
  case_link: varchar({ length: 1020 }),
  bid: float(),
  minimum_increment: float(),
  first_auction_date: datetime(),
  first_auction_bid: float(),
  second_auction_date: datetime(),
  second_auction_bid: float(),
  laudo_link: varchar({ length: 1020 }),
  matricula_link: varchar({ length: 1020 }),
  edital_link: varchar({ length: 1020 }),
  fetch_status: mysqlEnum(["not-fetched", "fetched", "failed"]).default(
    "not-fetched",
  ),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`)
    .onUpdateNow(),
});

export const scrapRelations = relations(scrapsTable, ({ many }) => ({
  files: many(scrapFilesTable),
}));

export const scrapFilesTable = mysqlTable("scrap_files", {
  id: int().primaryKey().autoincrement(),
  scrap_id: int().references(() => scrapsTable.id, { onDelete: "cascade" }),
  file_type: mysqlEnum(["jpg", "pdf"]).notNull(),
  url: varchar({ length: 1020 }).notNull(),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`)
    .onUpdateNow(),
});

export const scrapFilesRelations = relations(scrapFilesTable, ({ one }) => ({
  scrap: one(scrapsTable, {
    fields: [scrapFilesTable.scrap_id],
    references: [scrapsTable.id],
  }),
}));

export type ScrapWithFiles = typeof scrapsTable.$inferSelect & {
  files: (typeof scrapFilesTable.$inferSelect)[];
};
