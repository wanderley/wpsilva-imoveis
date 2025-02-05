import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { selectedScrapsForManualReview } from "@/selected-scraps";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { extrairAlienacaoFiduciaria } from "@/services/scraper/analises/extrair-alienacao-fiduciaria";
import { extrairDebitoExequendo } from "@/services/scraper/analises/extrair-debito-exequendo";
import { extrairHipoteca } from "@/services/scraper/analises/extrair-hipoteca";
import { extrairResumoMatricula } from "@/services/scraper/analises/extrair-resumo-matricula";
import {
  gerarContextoEdital,
  gerarContextoMatricula,
} from "@/services/scraper/analises/gerar-contexto";
import { eq } from "drizzle-orm";

export const descricao =
  "Atualiza a análise da hipoteca dos scraps selecionados para revisão manual";

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
    },
    where: (table, { and, eq, or, inArray, isNotNull }) =>
      and(
        inArray(table.id, selectedScrapsForManualReview),
        inArray(table.id, [866, 1, 3, 850, 67]), // while I am testing the editor
        isNotNull(table.edital_file),
        isNotNull(table.matricula_file),
        or(
          eq(table.analise_hipoteca_verificada, 0),
          eq(table.analise_alienacao_fiduciaria_verificada, 0),
          eq(table.analise_debito_exequendo_verificada, 0),
          eq(table.analise_resumo_matricula_verificada, 0),
        ),
      ),
    limit: 5,
  }),
  workers: 100,
  update: async (scrap) => {
    const [contextoEdital, contextoMatricula] = await Promise.all([
      gerarContextoEdital(scrap.edital_file!),
      gerarContextoMatricula(scrap.matricula_file!),
    ]);
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
            : await extrairDebitoExequendo(contextoEdital),
        analise_resumo_matricula:
          scrap.analise_resumo_matricula_verificada === 1
            ? undefined
            : await extrairResumoMatricula(contextoMatricula),
      })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
