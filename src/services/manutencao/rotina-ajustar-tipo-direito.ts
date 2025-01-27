import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { deriveTipoDireito } from "@/services/scraper/lib/derive-tipo-direito";
import { eq } from "drizzle-orm";

export const descricao = "Atualiza o tipo de direito dos scraps";

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      description: true,
    },
    where: (table, { and, eq, isNull }) =>
      and(
        isNull(table.analise_tipo_direito),
        eq(table.analise_tipo_direito_verificada, 0),
      ),
  }),
  workers: 100,
  update: async (scrap) => {
    const tipoDireito = await deriveTipoDireito(scrap.description!);
    await db
      .update(scrapsTable)
      .set({ analise_tipo_direito: tipoDireito })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
