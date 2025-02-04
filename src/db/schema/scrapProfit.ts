import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { scrapsTable } from "@/db/schema/scrap";
import { relations } from "drizzle-orm";
import { float, int, mysqlEnum, mysqlTable } from "drizzle-orm/mysql-core";

export type ScrapProfit = typeof scrapProfitTable.$inferSelect;

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
