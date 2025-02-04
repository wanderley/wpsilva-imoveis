import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const systemFilesTable = mysqlTable("system_files", {
  path: varchar("path", { length: 512 }).primaryKey().notNull(),
  extension: varchar("extension", { length: 255 }).notNull(),
  size: int("size").notNull(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  lastAccessed: timestamp("last_accessed").notNull(),
  createdAt,
  updatedAt,
});
