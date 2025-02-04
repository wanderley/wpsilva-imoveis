import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/mysql-core";

export const createdAt = timestamp("created_at")
  .notNull()
  .default(sql`now()`);

export const updatedAt = timestamp("updated_at")
  .notNull()
  .default(sql`now()`)
  .onUpdateNow();
