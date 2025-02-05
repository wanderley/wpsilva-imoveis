import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { extrairPorcentagemTitularidade } from "@/services/scraper/analises/extrair-porcentagem-titularidade";
import { eq } from "drizzle-orm";

export const descricao = "Atualiza a porcentagem de titularidade dos scraps";

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      description: true,
    },
    where: (table, { and, eq, isNull }) =>
      and(
        isNull(table.analise_porcentagem_titularidade),
        eq(table.analise_porcentagem_titularidade_verificada, 0),
      ),
  }),
  workers: 100,
  update: async (scrap) => {
    const porcentagem = await extrairPorcentagemTitularidade(
      scrap.description!,
    );
    await db
      .update(scrapsTable)
      .set({ analise_porcentagem_titularidade: porcentagem })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
