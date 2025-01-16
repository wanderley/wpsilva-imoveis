import { atualizarProcessoJudicial } from "@/services/processo-judicial/api";
import { Command } from "commander";

export default function ProcessoJudicial() {
  const program = new Command("processo-judicial").description(
    "Comandos para baixar processos",
  );

  program
    .command("baixar")
    .description("Baixar processos")
    .argument("[numero_processo]", "Numero do processo")
    .argument("[link_processo]", "Link do processo")
    .option("-n, --no-download-documentos", "Não baixar documentos")
    .action(
      async (
        numeroProcesso: string,
        linkProcesso: string,
        options: { downloadDocumentos: boolean },
      ) => {
        await atualizarProcessoJudicial(numeroProcesso, linkProcesso, {
          downloadDocumentos: options.downloadDocumentos,
        });
      },
    );

  return program;
}
