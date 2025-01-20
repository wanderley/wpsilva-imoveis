import assertNever from "@/lib/assert-never";
import { SystemFile } from "@/services/file/system-file";
import { generateText } from "@/services/openai/generate-text";
import { convertPdfToImages } from "@/services/pdf";
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

const PROMPT_EXTRACAO_TEXTO_DOCUMENTO = `**Objetivo**

Você é um agente LLM especializado em extrair texto e descrever imagens de documentos. Sua tarefa é converter imagens de documentos em texto formatado, **garantindo que todo o texto presente no documento seja extraído sem omissões**, incluindo descrições detalhadas de quaisquer imagens não institucionais presentes, excluindo cabeçalhos, rodapés e logotipos.

**Instruções**

- Extraia **todo o texto principal** do documento, assegurando que **nenhuma parte seja omitida**. Omita apenas cabeçalhos, rodapés e logotipos institucionais.
- **Preste muita atenção a quaisquer indicações de continuidade**, como "continua no verso" ou semelhantes. Certifique-se de incluir a continuação do texto no conteúdo extraído, garantindo que o texto esteja completo e sem interrupções.
- **Revise cuidadosamente** o texto extraído para garantir que nenhuma parte esteja faltando, comparando com o documento original. Se identificar trechos potencialmente ausentes, procure incluí-los na posição correta.
- Ignore imagens que sejam logotipos ou elementos gráficos institucionais.
- Para cada imagem não institucional:
  - Descreva detalhadamente seu conteúdo, capturando os principais detalhes visuais.
  - Se a imagem retratar o interior de um imóvel, descreva também as condições do imóvel.
  - Insira a descrição no local correspondente à posição da imagem no documento original.
  - Utilize o seguinte formato para as descrições de imagens: \`<imagem title="Título da Imagem">Descrição da imagem.</imagem>\`
- Inclua quaisquer tabelas presentes no documento, preservando sua estrutura e dados, formatando-as apropriadamente em **Markdown** ou **HTML**.
- Formate **todo o conteúdo em Markdown**, preservando a estrutura e a formatação original do documento.
- Não inclua etiquetas ou prefixos como "Imagem:", "Descrição da imagem:" ou similares no texto final.
- Retorne **apenas o texto final** em Markdown, sem incluir marcações de blocos de código ou textos adicionais.
- Se não houver imagens não institucionais no documento, **não** mencione a ausência delas nem inclua qualquer nota ou comentário sobre isso.`;

async function extrairTextoDocumento(
  documento: ProcessoJudicialTjspDocumentoSelect,
) {
  try {
    const file = new SystemFile(documento.arquivo);
    const images = await convertPdfToImages(file);
    const model = "gpt-4o-mini";

    const paginas = [];
    for (let i = 0; i < images.length; i += 5) {
      const batch = images.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (image, index) => {
          const text = await generateText(
            model,
            [image],
            PROMPT_EXTRACAO_TEXTO_DOCUMENTO,
          );
          if (!text) {
            throw new Error("Não foi possível extrair o texto da página");
          }
          return {
            pagina: documento.primeiraPagina + i + index,
            texto: fixText(text),
          };
        }),
      );
      paginas.push(...batchResults);
    }

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

function fixText(text: string) {
  text = text.replace(/^```markdown\n/, "");
  text = text.replace(/\n```\n?$/, "");
  return text;
}
