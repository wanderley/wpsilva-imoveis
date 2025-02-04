import { sql } from "drizzle-orm";
import {
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const openaiFilesTable = mysqlTable(
  "openai_files",
  {
    id: int().primaryKey().autoincrement(),
    url: varchar({ length: 767 }).notNull(),
    file_id: varchar({ length: 767 }).notNull(),
    created_at: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    url_idx: uniqueIndex("url_idx").on(table.url),
  }),
);
