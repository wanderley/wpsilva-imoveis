import * as ajustarDescricaoScraps from "@/services/manutencao/rotina-ajustar-descricao-scraps";
import * as ajustarFetchStatus from "@/services/manutencao/rotina-ajustar-fetch-status";
import * as ajustarTipoDireito from "@/services/manutencao/rotina-ajustar-tipo-direito";
import * as ajustarTipoImovel from "@/services/manutencao/rotina-ajustar-tipo-imovel";
import chalk from "chalk";
import { Command } from "commander";

const rotinas: { descricao: string; rotina: () => Promise<void> }[] = [
  ajustarDescricaoScraps,
  ajustarFetchStatus,
  ajustarTipoDireito,
  ajustarTipoImovel,
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
