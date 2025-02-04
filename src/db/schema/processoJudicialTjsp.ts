import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { processoJudicialTjspDocumentosTable } from "@/db/schema/processoJudicialTjspDocumento";
import {
  DadosPrincipais,
  ParteInteressada,
} from "@/services/processo-judicial/tjsp/types";
import { relations } from "drizzle-orm";
import {
  datetime,
  float,
  json,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

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
  createdAt,
  updatedAt,
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
