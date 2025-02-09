import { mapAsync } from "@/lib/promise";
import { googleCached } from "@/services/ai/providers";
import { SystemFile } from "@/services/file/system-file";
import { convertPdfToImages } from "@/services/pdf";
import { extractTextFromPdfWithTika } from "@/services/pdf/tika";
import { generateText } from "ai";

export async function gerarContextoEdital(editalFilePath: string) {
  const editalFile = new SystemFile(editalFilePath);
  await editalFile.download();
  return {
    type: "documento",
    props: [{ name: "nome", value: "edital" }],
    content: (await extractTextFromPdfWithTika(editalFile)).trim(),
  };
}

export async function gerarContextoMatricula(matriculaFilePath: string) {
  return {
    type: "documento",
    props: [{ name: "nome", value: "matricula" }],
    content: await gerarContextoMatriculaGemini(matriculaFilePath),
  };
}

async function gerarContextoMatriculaGemini(matriculaFilePath: string) {
  const matriculaFile = new SystemFile(matriculaFilePath);
  const images = await convertPdfToImages(matriculaFile);
  const paginas = await mapAsync(
    images,
    async (image) => {
      const texto = await generateText({
        model: googleCached("gemini-2.0-flash"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: PROMPT_EXTRACAO_TEXTO_DOCUMENTO,
              },
              {
                type: "file",
                data: await image.read(),
                mimeType: "image/webp",
              },
            ],
          },
        ],
      });
      return texto.text.trim();
    },
    { workers: 10 },
  );
  return paginas.join("\n");
}

const PROMPT_EXTRACAO_TEXTO_DOCUMENTO = `**Objetivo**

Você é um advogado especialista em extrair texto de matrículas de registro de imóveis no Brasil. Sua tarefa é converter a imagem de uma página da matrícula em texto formatado, **garantindo que todo o texto presente na páginaseja  extraído sem omissões**, excluindo cabeçalhos, rodapés, imagens e logotipos.

**Instruções**

- Detecte a área da página que contem o texto principal dos registros da matrícula e foque apenas nessa área.
- Extraia **todo o texto principal** da matrícula, assegurando que **nenhuma parte seja omitida**. Omita apenas cabeçalhos, rodapés, imagens e logotipos institucionais.
- **Revise cuidadosamente** o texto extraído para garantir que nenhuma parte esteja faltando, comparando com a matrícula original. Se identificar trechos potencialmente ausentes, procure incluí-los na posição correta.
- Não incluir referências de continuidade, como "continua no verso", "vide verso", "vide página seguinte" ou expressões equivalentes.
- Omitir assinaturas,logotipos, imagens e tabelas presentes na matrícula.
- Formate **todo o conteúdo em Markdown**, preservando a estrutura e a formatação original da matrícula.
- Retorne **apenas o texto final** em Markdown, sem incluir marcações de blocos de código ou textos adicionais.`;
