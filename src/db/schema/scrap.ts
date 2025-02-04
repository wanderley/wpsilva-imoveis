import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { scrapAnalysesTable } from "@/db/schema/scrapAnalysis";
import { scrapFilesTable } from "@/db/schema/scrapFile";
import { ScrapProfit, scrapProfitTable } from "@/db/schema/scrapProfit";
import { validatedAddressTable } from "@/db/schema/validatedAddress";
import { AnaliseAlienacaoFiduciaria } from "@/services/scraper/lib/derive-alienacao-fiduciaria";
import { AnaliseDebitoExequendo } from "@/services/scraper/lib/derive-debito-exequendo";
import { AnaliseHipoteca } from "@/services/scraper/lib/derive-hipoteca";
import { AnaliseResumoMatricula } from "@/services/scraper/lib/derive-resumo-matricula";
import { relations } from "drizzle-orm";
import {
  datetime,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const scrapsTable = mysqlTable("scraps", {
  id: int().primaryKey().autoincrement(),
  scraper_id: varchar({ length: 767 }).notNull(),
  name: varchar({ length: 767 }),
  url: varchar({ length: 767 }).notNull(),
  address: varchar({ length: 767 }),
  description: text(),
  description_markdown: text(),
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
  // campos de análise
  analise_tipo_direito: mysqlEnum([
    "Propriedade plena",
    "Nua-propriedade",
    "Direitos fiduciários",
    "Direitos possessórios",
    "Direitos do compromissário comprador",
  ]),
  analise_tipo_direito_verificada: int().default(0),
  analise_tipo_imovel: mysqlEnum([
    "Casa",
    "Apartamento",
    "Terreno",
    "Vaga de garagem",
    "Imóvel comercial",
  ]),
  analise_tipo_imovel_verificada: int().default(0),
  analise_porcentagem_titularidade: int(),
  analise_porcentagem_titularidade_verificada: int().default(0),
  analise_hipoteca: json("analise_hipoteca").$type<AnaliseHipoteca>(),
  analise_hipoteca_verificada: int().default(0),
  analise_alienacao_fiduciaria: json(
    "analise_alienacao_fiduciaria",
  ).$type<AnaliseAlienacaoFiduciaria>(),
  analise_alienacao_fiduciaria_verificada: int().default(0),
  analise_debito_exequendo: json(
    "analise_debito_exequendo",
  ).$type<AnaliseDebitoExequendo>(),
  analise_debito_exequendo_verificada: int().default(0),
  analise_resumo_matricula: json(
    "analise_resumo_matricula",
  ).$type<AnaliseResumoMatricula>(),
  analise_resumo_matricula_verificada: int().default(0),
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
