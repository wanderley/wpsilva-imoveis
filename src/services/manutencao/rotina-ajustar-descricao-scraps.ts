import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { mapAsync } from "@/lib/promise";
import { formatTextAsMarkdown } from "@/services/openai/format-text-as-markdown";
import chalk from "chalk";
import { and, eq, isNotNull, isNull } from "drizzle-orm";

export const descricao = "Atualiza a versão markdown da descrição dos scraps";

export async function rotina(): Promise<void> {
  const scraps = await db.query.scrapsTable.findMany({
    columns: {
      id: true,
      description: true,
    },
    where: and(
      isNotNull(scrapsTable.description),
      isNull(scrapsTable.description_markdown),
    ),
  });
  if (scraps.length === 0) {
    console.log("Nenhum scrap para atualizar");
    return;
  }
  let success = 0;
  let fail = 0;
  logProgress(success, fail, scraps.length);
  await mapAsync(
    scraps,
    async (scrap): Promise<void> => {
      try {
        const markdown = await formatTextAsMarkdown(scrap.description ?? "");
        await db
          .update(scrapsTable)
          .set({ description_markdown: markdown })
          .where(eq(scrapsTable.id, scrap.id));
        success++;
      } catch (error) {
        console.error(`Erro ao atualizar scrap: ${scrap.id}`, error);
        fail++;
      } finally {
        logProgress(success, fail, scraps.length);
      }
    },
    { workers: 100 },
  );
  console.log("Atualização concluída");
}

function logProgress(success: number, fail: number, total: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${total} scraps para atualizar: ${(((success + fail) / total) * 100).toFixed(2)}% (${chalk.green(
      success,
    )} ok, ${chalk.red(fail)} fail)`,
  );
}
