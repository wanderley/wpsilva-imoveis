import assertNever from "@/lib/assert-never";
import { SystemFile } from "@/services/file/system-file";
import { extractTextWithAi } from "@/services/pdf/extract-text-with-ai";
import {
  ProcessoJudicialTjspDocumentoSelect,
  carregarProcesso,
  salvarDocumento,
} from "@/services/processo-judicial/tjsp/repository";

export async function extrairTextosProcesso(
  numeroProcesso: string,
  options: { updateType: "batch" | "immediate" },
) {
  switch (options.updateType) {
    case "batch":
      throw new Error("Not implemented");
    case "immediate":
      await immediate(numeroProcesso);
      break;
    default:
      assertNever(options.updateType);
  }
}

const filtroDocumentosEssenciais = [
  { like: "petição", tipos: ["719", "9500"] },
  { like: "decisão", tipos: ["19"] },
  { like: "agravo", tipos: ["8092"] },
  { like: "acórdão", tipos: ["1190"] },
  { like: "sentença", tipos: ["10003"] },
  { like: "edital", tipos: ["1518"] },
  { like: "execução provisória", tipos: ["10003"] },
  { like: "cumprimento provisório de sentença", tipos: ["10003"] },
];

async function immediate(numeroProcesso: string) {
  const processo = await carregarProcesso(numeroProcesso);
  if (!processo) {
    console.error(`Processo ${numeroProcesso} not found`);
    return;
  }
  const documentos = processo.documentos.filter((documento) =>
    filtroDocumentosEssenciais.some(
      (filtro) =>
        documento.tipoDocumentoDigital === filtro.tipos[0] ||
        documento.arquivo.toLowerCase().includes(filtro.like),
    ),
  );
  for (let i = 0; i < documentos.length; i += 5) {
    const batch = documentos.slice(i, i + 5);
    await Promise.all(
      batch.map(async (documento) => {
        if (documento.textoExtraido.state === "success") {
          return;
        }
        await extrairTextoDocumento(documento);
      }),
    );
  }
}

async function extrairTextoDocumento(
  documento: ProcessoJudicialTjspDocumentoSelect,
) {
  try {
    const file = new SystemFile(documento.arquivo);
    const model = "gpt-4o-mini";
    const paginas = await extractTextWithAi(file, model);

    await salvarDocumento({
      ...documento,
      textoExtraido: {
        state: "success",
        type: model,
        paginas,
      },
    });
    console.info(
      `[extrair-texto-documentos] Texto extraído com sucesso: ${documento.arquivo}`,
    );
  } catch (error) {
    await salvarDocumento({
      ...documento,
      textoExtraido: { state: "error", reason: (error as Error).message },
    });
  }
}
