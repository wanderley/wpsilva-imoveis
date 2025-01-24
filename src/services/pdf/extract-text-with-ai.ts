import crypto from "crypto";
import path from "path";

import { LocalFile } from "../file/local-file";
import { IFile } from "../file/types";
import { generateText } from "../openai/generate-text";
import { Model } from "../openai/types";
import { convertPdfToImages } from "../pdf";

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

const PROMPT_EXTRACAO_TEXTO_DOCUMENTO_HASH = crypto
  .createHash("md5")
  .update(PROMPT_EXTRACAO_TEXTO_DOCUMENTO)
  .digest("hex");

type ExtractedText = {
  pagina: number;
  texto: string;
};

export async function extractTextWithAi(
  file: IFile,
  model: Model = "gpt-4o-mini",
): Promise<ExtractedText[]> {
  const cache = await getCache(file);
  if (cache) {
    return cache;
  }
  const images = await convertPdfToImages(file, "webp");

  const paginas = await Promise.all(
    images.map(async (image, index) => {
      const text = await generateText(
        model,
        [image],
        PROMPT_EXTRACAO_TEXTO_DOCUMENTO,
      );
      if (!text) {
        throw new Error("Não foi possível extrair o texto da página");
      }
      return {
        pagina: index + 1,
        texto: fixText(text),
      };
    }),
  );
  const res = paginas.sort((a, b) => a.pagina - b.pagina);
  await setCache(file, res);
  return res;
}

function fixText(text: string) {
  text = text.replace(/^```markdown\n/, "");
  text = text.replace(/\n```\n?$/, "");
  return text;
}

async function getCache(file: IFile): Promise<ExtractedText[] | undefined> {
  const cacheFile = await getCacheFile(file);
  if (await cacheFile.exists()) {
    return JSON.parse(
      (await cacheFile.read()).toString("utf-8"),
    ) as ExtractedText[];
  }
  return undefined;
}

async function setCache(file: IFile, extractedText: ExtractedText[]) {
  const cacheFile = await getCacheFile(file);
  await cacheFile.write(Buffer.from(JSON.stringify(extractedText, null, 2)));
}

async function getCacheFile(file: IFile) {
  const cacheFile = new LocalFile(
    path.join(
      "pdf/extracted-text/",
      PROMPT_EXTRACAO_TEXTO_DOCUMENTO_HASH,
      file.path() + ".json",
    ),
  );
  return cacheFile;
}
