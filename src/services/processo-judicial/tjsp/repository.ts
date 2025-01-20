import { db } from "@/db";
import {
  processoJudicialTjspDocumentosTable,
  processoJudicialTjspTable,
} from "@/db/schema";
import { SystemError } from "@/lib/error";
import { DadosPrincipais } from "@/services/processo-judicial/tjsp/types";
import { and, eq } from "drizzle-orm";

type ProcessoJudicialTjspDocumentoInsert = Omit<
  typeof processoJudicialTjspDocumentosTable.$inferInsert,
  "createdAt" | "updatedAt"
>;

export type ProcessoJudicialTjspDocumentoSelect = Omit<
  typeof processoJudicialTjspDocumentosTable.$inferSelect,
  "createdAt" | "updatedAt"
>;

export async function salvarDadosPrincipais(
  numeroProcesso: string,
  dadosPrincipais: DadosPrincipais,
) {
  await db
    .insert(processoJudicialTjspTable)
    .values({
      numeroProcesso,
      ...dadosPrincipais,
    })
    .onDuplicateKeyUpdate({ set: dadosPrincipais });
}

export async function salvarDocumento(
  documento: ProcessoJudicialTjspDocumentoInsert,
) {
  const saved = await carregarDocumento(documento);
  if (saved && saved.ultimaPagina !== documento.ultimaPagina) {
    throw new SystemError(
      "Documento com páginas diferentes.  Isso é muito raro porque significa que um documento antigo do processo foi alterado.",
    );
  }
  await db
    .insert(processoJudicialTjspDocumentosTable)
    .values(documento)
    .onDuplicateKeyUpdate({ set: documento });
}

export async function carregarDocumento(
  documento: Pick<
    ProcessoJudicialTjspDocumentoSelect,
    "numeroProcesso" | "primeiraPagina"
  >,
) {
  return await db.query.processoJudicialTjspDocumentosTable.findFirst({
    where: and(
      eq(
        processoJudicialTjspDocumentosTable.numeroProcesso,
        documento.numeroProcesso,
      ),
      eq(
        processoJudicialTjspDocumentosTable.primeiraPagina,
        documento.primeiraPagina,
      ),
    ),
  });
}

export async function carregarProcesso(numeroProcesso: string) {
  return await db.query.processoJudicialTjspTable.findFirst({
    with: {
      documentos: true,
    },
    where: eq(processoJudicialTjspTable.numeroProcesso, numeroProcesso),
  });
}
