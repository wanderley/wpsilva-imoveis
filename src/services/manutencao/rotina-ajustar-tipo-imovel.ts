import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { extrairTipoImovel } from "@/services/scraper/analises/extrair-tipo-imovel";
import { eq } from "drizzle-orm";

export const descricao = "Atualiza o tipo de imóvel dos scraps";

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      description: true,
    },
    where: (table, { and, eq, isNull }) =>
      and(
        isNull(table.analise_tipo_imovel),
        eq(table.analise_tipo_imovel_verificada, 0),
      ),
  }),
  workers: 100,
  update: async (scrap) => {
    const tipoImovel = await extrairTipoImovel(scrap.description!);
    await db
      .update(scrapsTable)
      .set({ analise_tipo_imovel: tipoImovel })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
