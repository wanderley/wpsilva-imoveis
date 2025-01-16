import { db } from "@/db";
import {
  processoJudicialTjspDocumentosTable,
  processoJudicialTjspTable,
} from "@/db/schema";
import { SystemError } from "@/lib/error";
import {
  DadosPrincipais,
  Documento,
} from "@/services/processo-judicial/tjsp/types";
import { and, eq } from "drizzle-orm";

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

export async function carregarDocumento(documento: Documento) {
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

export async function salvarDocumento(documento: Documento) {
  const saved = await carregarDocumento(documento);
  if (saved && saved.ultimaPagina !== documento.ultimaPagina) {
    throw new SystemError(
      "Documento com páginas diferentes.  Isso é muito raro porque significa que um documento antigo do processo foi alterado.",
    );
  }
  const data = {
    numeroProcesso: documento.numeroProcesso,
    codigoDocumento: documento.codigoDocumento,
    incluidoEm: documento.dataInclusao,
    primeiraPagina: documento.primeiraPagina,
    ultimaPagina: documento.ultimaPagina,
    tipoDocumentoDigital: documento.tipoDocumentoDigital,
    folhaPeticaoInicial: documento.folhaPeticaoInicial ? 1 : 0,
    codigoProcessoOrigem: documento.codigoProcessoOrigem,
    partesProcessoOrigem: documento.partesProcessoOrigem,
    arquivo: documento.file.path(),
  };
  await db
    .insert(processoJudicialTjspDocumentosTable)
    .values(data)
    .onDuplicateKeyUpdate({ set: data });
}
