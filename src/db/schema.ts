import { Schema } from "@/services/analyser/schema";
import {
  DadosPrincipais,
  ParteInteressada,
} from "@/services/processo-judicial/tjsp/types";
import { TextoExtraido } from "@/services/processo-judicial/types";
import { relations, sql } from "drizzle-orm";
import {
  datetime,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const createdAt = timestamp("created_at")
  .notNull()
  .default(sql`now()`);
const updatedAt = timestamp("updated_at")
  .notNull()
  .default(sql`now()`)
  .onUpdateNow();

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  created_at: createdAt,
  updated_at: updatedAt,
});

export const verificationTokens = mysqlTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 })
    .notNull()
    .references(() => users.email, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.identifier],
      references: [users.email],
    }),
  }),
);

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
  auction_status: mysqlEnum([
    "waiting-to-start",
    "open-for-bids",
    "sold",
    "closed",
    "impaired",
    "suspended",
    "unknown",
  ]).default("unknown"),
  first_auction_date: datetime(),
  first_auction_bid: float(),
  second_auction_date: datetime(),
  second_auction_bid: float(),
  laudo_link: varchar({ length: 767 }),
  laudo_file: varchar({ length: 512 }),
  matricula_link: varchar({ length: 767 }),
  matricula_file: varchar({ length: 512 }),
  edital_link: varchar({ length: 767 }),
  edital_file: varchar({ length: 512 }),
  fetch_status: mysqlEnum(["not-fetched", "fetched", "failed"]).default(
    "not-fetched",
  ),
  is_interesting: int(),
  created_at: createdAt,
  updated_at: updatedAt,
});

export const scrapRelations = relations(scrapsTable, ({ one, many }) => ({
  files: many(scrapFilesTable),
  analyses: many(scrapAnalysesTable),
  profit: one(scrapProfitTable),
  validatedAddress: one(validatedAddressTable, {
    fields: [scrapsTable.address],
    references: [validatedAddressTable.original_address],
  }),
}));

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

export const scrapProfitTable = mysqlTable("scrap_profit", {
  id: int().primaryKey().autoincrement(),
  scrap_id: int()
    .references(() => scrapsTable.id, { onDelete: "cascade" })
    .notNull(),
  status: mysqlEnum(["default-values", "overridden"]).default("default-values"),
  valor_arrematacao: float().default(0).notNull(),
  valor_venda: float().default(0).notNull(),
  lucro: float().default(0).notNull(),
  lucro_percentual: float().default(0).notNull(),
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
  created_at: createdAt,
  updated_at: updatedAt,
});

export const scrapProfitRelations = relations(scrapProfitTable, ({ one }) => ({
  scrap: one(scrapsTable, {
    fields: [scrapProfitTable.scrap_id],
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

export type ScrapProfit = typeof scrapProfitTable.$inferSelect;

export type Scrap = typeof scrapsTable.$inferSelect & {
  preferred_auction_date: string | null;
  preferred_auction_bid: number | null;
  gross_discount: number;
  files: (typeof scrapFilesTable.$inferSelect)[];
  analyses: (typeof scrapAnalysesTable.$inferSelect)[];
  profit: ScrapProfit | null;
  validatedAddress: typeof validatedAddressTable.$inferSelect | null;
};

export type ScrapAuctionStatus =
  (typeof scrapsTable.auction_status.enumValues)[number];

export const processoJudicialTjspTable = mysqlTable("processo_judicial_tjsp", {
  numeroProcesso: varchar("numero_processo", { length: 255 })
    .primaryKey()
    .notNull(),
  classe: varchar("classe", { length: 255 }),
  assunto: varchar("assunto", { length: 255 }),
  foro: varchar("foro", { length: 255 }),
  vara: varchar("vara", { length: 255 }),
  juiz: varchar("juiz", { length: 255 }),
  distribuicao: datetime("distribuicao"),
  numeroControle: varchar("numero_controle", { length: 255 }),
  area: varchar("area", { length: 255 }),
  valorAcao: float("valor_acao"),
  situacao: varchar("situacao", { length: 255 }),
  processoPrincipal: varchar("processo_principal", { length: 255 }),
  partes: json("partes").$type<ParteInteressada[]>().notNull(),
  apensos: json("apensos").$type<DadosPrincipais["apensos"]>().notNull(),
  createdAt: createdAt,
  updatedAt: updatedAt,
});

export const processoJudicialTjspRelations = relations(
  processoJudicialTjspTable,
  ({ one, many }) => ({
    documentos: many(processoJudicialTjspDocumentosTable),
    processoPrincipal: one(processoJudicialTjspTable, {
      fields: [processoJudicialTjspTable.processoPrincipal],
      references: [processoJudicialTjspTable.numeroProcesso],
    }),
  }),
);

export const processoJudicialTjspDocumentosTable = mysqlTable(
  "processo_judicial_tjsp_documentos",
  {
    numeroProcesso: varchar("numero_processo", { length: 255 }).notNull(),
    codigoDocumento: varchar("codigo_documento", { length: 255 }).notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    incluidoEm: datetime("incluido_em").notNull(),
    primeiraPagina: int("primeira_pagina").notNull(),
    ultimaPagina: int("ultima_pagina").notNull(),
    arquivo: varchar("arquivo", { length: 1024 }).notNull(),
    tipoDocumentoDigital: varchar("tipo_documento_digital", {
      length: 255,
    }).notNull(),
    folhaPeticaoInicial: int("folha_peticao_inicial").notNull(),
    codigoProcessoOrigem: varchar("codigo_processo_origem", { length: 255 }),
    partesProcessoOrigem: json("partes_processo_origem").$type<
      ParteInteressada[]
    >(),
    textoExtraido: json("texto_extraido")
      .$type<TextoExtraido>()
      .default({ state: "pending" })
      .notNull(),
    createdAt,
    updatedAt,
  },
  (table) => ({
    pk: primaryKey({
      name: "processo_judicial_tjsp_documentos_pk",
      columns: [table.numeroProcesso, table.primeiraPagina],
    }),
  }),
);

export const processoJudicialTjspDocumentosRelations = relations(
  processoJudicialTjspDocumentosTable,
  ({ one }) => ({
    processoJudicialTjsp: one(processoJudicialTjspTable, {
      fields: [processoJudicialTjspDocumentosTable.numeroProcesso],
      references: [processoJudicialTjspTable.numeroProcesso],
    }),
    systemFile: one(systemFilesTable, {
      fields: [processoJudicialTjspDocumentosTable.arquivo],
      references: [systemFilesTable.path],
    }),
  }),
);

export const systemFilesTable = mysqlTable("system_files", {
  path: varchar("path", { length: 512 }).primaryKey().notNull(),
  extension: varchar("extension", { length: 255 }).notNull(),
  size: int("size").notNull(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  lastAccessed: timestamp("last_accessed").notNull(),
  createdAt,
  updatedAt,
});
