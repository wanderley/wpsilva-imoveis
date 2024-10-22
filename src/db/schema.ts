import { sql } from "drizzle-orm";
import {
  boolean,
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
  scrapper_id: varchar({ length: 1020 }).notNull(),
  url: varchar({ length: 1020 }).notNull(),
  is_fetched: boolean().default(false),
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
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`)
    .onUpdateNow(),
});

export const scrapFilesTable = mysqlTable("scrap_files", {
  id: int().primaryKey().autoincrement(),
  scrap_id: int().references(() => scrapsTable.id, { onDelete: "cascade" }),
  file_type: mysqlEnum(["jpg", "pdf"]),
  document_type: mysqlEnum(["imagem_lote", "edital", "laudo", "matricula"]),
  url: varchar({ length: 1020 }).notNull(),
  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`)
    .onUpdateNow(),
});

export type Scrap = typeof scrapsTable.$inferInsert;
export type SelectScrap = typeof scrapsTable.$inferSelect;

export type ScrapFile = typeof scrapFilesTable.$inferInsert;
export type SelectScrapFile = typeof scrapFilesTable.$inferSelect;
