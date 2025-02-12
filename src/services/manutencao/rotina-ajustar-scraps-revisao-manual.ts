import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { selectedScrapsForManualReview } from "@/selected-scraps";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { extrairAlienacaoFiduciaria } from "@/services/scraper/analises/extrair-alienacao-fiduciaria";
import { extrairDebitoExequendo } from "@/services/scraper/analises/extrair-debito-exequendo";
import { extrairDebitoOutros } from "@/services/scraper/analises/extrair-debito-outros";
import { extrairHipoteca } from "@/services/scraper/analises/extrair-hipoteca";
import { extrairResumoMatricula } from "@/services/scraper/analises/extrair-resumo-matricula";
import { extrairTipoExecucao } from "@/services/scraper/analises/extrair-tipo-execucao";
import {
  gerarContextoEdital,
  gerarContextoMatricula,
} from "@/services/scraper/analises/gerar-contexto";
import { eq } from "drizzle-orm";

export const descricao =
  "Atualiza a análise da hipoteca dos scraps selecionados para revisão manual";

const focusScrapIds: number[] = [];

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      edital_file: true,
      matricula_file: true,
      analise_hipoteca_verificada: true,
      analise_alienacao_fiduciaria_verificada: true,
      analise_debito_exequendo_verificada: true,
      analise_resumo_matricula_verificada: true,
      analise_debito_outros_verificada: true,
      analise_tipo_execucao_verificada: true,
    },
    where: (table, { and, eq, or, inArray, isNotNull }) =>
      and(
        inArray(
          table.id,
          focusScrapIds.length > 0
            ? focusScrapIds
            : selectedScrapsForManualReview,
        ),
        isNotNull(table.edital_file),
        isNotNull(table.matricula_file),
        or(
          eq(table.analise_hipoteca_verificada, 0),
          eq(table.analise_alienacao_fiduciaria_verificada, 0),
          eq(table.analise_debito_exequendo_verificada, 0),
          eq(table.analise_resumo_matricula_verificada, 0),
          eq(table.analise_debito_outros_verificada, 0),
          eq(table.analise_tipo_execucao_verificada, 0),
        ),
      ),
  }),
  workers: 100,
  update: async (scrap) => {
    const [contextoEdital, contextoMatricula] = await Promise.all([
      gerarContextoEdital(scrap.edital_file!),
      gerarContextoMatricula(scrap.matricula_file!),
    ]);
    const debitoExequendo = await extrairDebitoExequendo(contextoEdital);
    await db
      .update(scrapsTable)
      .set({
        analise_hipoteca:
          scrap.analise_hipoteca_verificada === 1
            ? undefined
            : await extrairHipoteca(contextoEdital, contextoMatricula),
        analise_alienacao_fiduciaria:
          scrap.analise_alienacao_fiduciaria_verificada === 1
            ? undefined
            : await extrairAlienacaoFiduciaria(
                contextoEdital,
                contextoMatricula,
              ),
        analise_debito_exequendo:
          scrap.analise_debito_exequendo_verificada === 1
            ? undefined
            : debitoExequendo,
        analise_resumo_matricula:
          scrap.analise_resumo_matricula_verificada === 1
            ? undefined
            : await extrairResumoMatricula(contextoMatricula),
        analise_debito_outros:
          scrap.analise_debito_outros_verificada === 1
            ? undefined
            : await extrairDebitoOutros(
                contextoEdital,
                await extrairTipoExecucao(contextoEdital),
                debitoExequendo,
              ),
        analise_tipo_execucao:
          scrap.analise_tipo_execucao_verificada === 1
            ? undefined
            : await extrairTipoExecucao(contextoEdital),
      })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
