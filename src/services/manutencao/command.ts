import chalk from "chalk";
import { Command } from "commander";

import * as ajustarDescricaoScraps from "./rotina-ajustar-descricao-scraps";
import * as ajustarFetchStatus from "./rotina-ajustar-fetch-status";

const rotinas: { descricao: string; rotina: () => Promise<void> }[] = [
  ajustarDescricaoScraps,
  ajustarFetchStatus,
];

export default function ManutencaoCommand() {
  const program = new Command("manutencao")
    .description("Rotinas de manutenção do banco de dados")
    .action(async () => {
      for (const rotina of rotinas) {
        console.info(chalk.bold.yellow(`Rotina: ${rotina.descricao}`));
        await rotina.rotina();
        console.info(chalk.green("Rotina finalizada"));
      }
    });

  return program;
}
