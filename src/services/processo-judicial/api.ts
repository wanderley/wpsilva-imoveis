import { atualizarProcessoJudicialTjsp } from "@/services/processo-judicial/tjsp/api";

export async function atualizarProcessoJudicial(
  numeroProcesso: string,
  linkProcesso: string,
  options: {
    downloadDocumentos: boolean;
  },
) {
  // numeroProcesso format AAAAAAA-DD.AAAA.J.TR.OOOO
  const codigoTribunal = numeroProcesso.substring(16, 20);
  switch (codigoTribunal) {
    case "8.26":
      await atualizarProcessoJudicialTjsp(
        numeroProcesso,
        linkProcesso,
        options,
      );
      break;
    default:
      console.error(
        `Tribunal desconhecido: ${codigoTribunal} para o número de processo ${numeroProcesso}`,
      );
  }
}
