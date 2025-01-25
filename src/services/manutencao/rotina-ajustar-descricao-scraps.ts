import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { formatTextAsMarkdown } from "@/services/ai/format-text-as-markdown";
import { updateDb } from "@/services/manutencao/lib/update-db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export const descricao = "Atualiza a versão markdown da descrição dos scraps";

export const rotina = updateDb({
  query: db.query.scrapsTable.findMany({
    columns: {
      id: true,
      description: true,
    },
    where: and(
      isNotNull(scrapsTable.description),
      isNull(scrapsTable.description_markdown),
    ),
  }),
  workers: 100,
  update: async (scrap): Promise<void> => {
    const markdown = await formatTextAsMarkdown(scrap.description ?? "");
    await db
      .update(scrapsTable)
      .set({ description_markdown: markdown })
      .where(eq(scrapsTable.id, scrap.id));
  },
});
