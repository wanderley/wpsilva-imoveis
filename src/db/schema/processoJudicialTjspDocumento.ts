import { createdAt, updatedAt } from "@/db/schema/lib/common-fields";
import { processoJudicialTjspTable } from "@/db/schema/processoJudicialTjsp";
import { systemFilesTable } from "@/db/schema/systemFile";
import { ParteInteressada } from "@/services/processo-judicial/tjsp/types";
import { TextoExtraido } from "@/services/processo-judicial/types";
import { relations } from "drizzle-orm";
import {
  datetime,
  int,
  json,
  mysqlTable,
  primaryKey,
  varchar,
} from "drizzle-orm/mysql-core";

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
