import { relations, sql } from "drizzle-orm";
import {
  datetime,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const scrapsTable = mysqlTable("scraps", {
  id: int().primaryKey().autoincrement(),
  scraper_id: varchar({ length: 767 }).notNull(),
  name: varchar({ length: 767 }),
  url: varchar({ length: 767 }).notNull(),
  address: varchar({ length: 767 }),
  description: text(),
  case_number: varchar({ length: 255 }),
  case_link: varchar({ length: 767 }),
  bid: float(),
  appraisal: float(),
  first_auction_date: datetime(),
  first_auction_bid: float(),
  second_auction_date: datetime(),
  second_auction_bid: float(),
  laudo_link: varchar({ length: 767 }),
  matricula_link: varchar({ length: 767 }),
  edital_link: varchar({ length: 767 }),
  fetch_status: mysqlEnum(["not-fetched", "fetched", "failed"]).default(
    "not-fetched",
  ),
  valor_arrematacao: float().default(0).notNull(),
  valor_venda: float().default(0).notNull(),
  custo_arrematacao_comissao_leiloeiro_percentual: float()
    .default(0.05)
    .notNull(),
  custo_arrematacao_registro: float().default(1500).notNull(),
  custo_arrematacao_itbi_percentual: float().default(0.03).notNull(),
  custo_arrematacao_advogado: float().default(0).notNull(),
  custo_pos_imissao_reforma: float().default(5000).notNull(),
  custo_pos_imissao_divida_iptu: float().default(0).notNull(),
  custo_pos_imissao_divida_condominio: float().default(0).notNull(),
  custo_pos_imissao_outros: float().default(0).notNull(),
  custo_pos_arrematacao_prazo_de_venda_em_meses: int().default(12).notNull(),
  custo_pos_arrematacao_valor_iptu_mensal: float().default(0).notNull(),
  custo_pos_arrematacao_valor_condominio_mensal: float().default(0).notNull(),
  custo_pos_venda_comissao_corretora_percentual: float().default(0).notNull(),
  custo_pos_venda_imposto_ganho_capita_percentual: float()
    .default(0.15)
    .notNull(),
  analysis_status: text("analysis_status").default("none"),
  analysis_thread_id: text("analysis_thread_id"),
  analysis_result: text("analysis_result"),
  is_interesting: int(),
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
  url: varchar({ length: 767 }).notNull(),
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

export type ScrapWithFiles = typeof scrapsTable.$inferSelect & {
  files: (typeof scrapFilesTable.$inferSelect)[];
};
