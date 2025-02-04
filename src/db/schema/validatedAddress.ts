import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import {
  float,
  int,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

export const validatedAddressTable = mysqlTable("validated_address", {
  id: int().primaryKey().autoincrement(),
  original_address: varchar({ length: 767 }).notNull().unique(),
  formatted_address: varchar({ length: 767 }).notNull(),
  administrative_area_level_2: varchar({ length: 255 }).notNull(),
  administrative_area_level_1: varchar({ length: 255 }).notNull(),
  country: varchar({ length: 255 }).notNull(),
  street_number: varchar({ length: 255 }),
  route: varchar({ length: 255 }).notNull(),
  sublocality: varchar({ length: 255 }).notNull(),
  subpremise: varchar({ length: 255 }),
  postal_code: varchar({ length: 255 }).notNull(),
  latitude: float().notNull(),
  longitude: float().notNull(),
  validation_status: mysqlEnum(["valid", "invalid", "not_found"]).notNull(),
  created_at: createdAt,
  updated_at: updatedAt,
});
