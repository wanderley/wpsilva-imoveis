import { stringifyError } from "@/lib/error";
import { mapAsync } from "@/lib/promise";
import chalk from "chalk";

type UpdateDbConfig<Item> = {
  query: Promise<Item[]>;
  workers: number;
  update: (item: Item) => Promise<void>;
};

export function updateDb<Item>(
  config: UpdateDbConfig<Item>,
): () => Promise<void> {
  return async () => {
    const items = await config.query;
    if (items.length === 0) {
      console.log("Nenhum item para atualizar");
      return;
    }
    let successCount = 0;
    let failCount = 0;
    logProgress(successCount, failCount, items.length);
    await mapAsync(
      items,
      async (item): Promise<void> => {
        try {
          await config.update(item);
          successCount++;
        } catch (error) {
          console.error(`Erro ao atualizar item: ${item}`);
          console.error(stringifyError(error));
          failCount++;
        } finally {
          logProgress(successCount, failCount, items.length);
        }
      },
      { workers: config.workers },
    );
    console.log("Atualização concluída!");
  };
}

function logProgress(success: number, fail: number, total: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${total} items para atualizar: ${(((success + fail) / total) * 100).toFixed(2)}% (${chalk.green(
      success,
    )} ok, ${chalk.red(fail)} fail)`,
  );
  if (success + fail === total) {
    console.log("");
  }
}
