import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { openaiCached } from "@/services/ai/openai-cached";
import { SystemFile } from "@/services/file/system-file";
import { extractTextWithAi } from "@/services/pdf/extract-text-with-ai";
import { streamText } from "ai";
import { eq } from "drizzle-orm";

// Allow streaming responses up to 5 minutes
// since it can take a while to generate the
// system message for the first time
export const maxDuration = 60 * 5;

export async function POST(req: Request) {
  const { messages, scrapId } = await req.json();
  const system = await getSystemMessage(scrapId);
  const result = streamText({
    model: openaiCached("gpt-4o-mini"),
    messages,
    system,
  });
  return result.toDataStreamResponse();
}

async function getSystemMessage(scrapId: number) {
  const scrap = await db.query.scrapsTable.findFirst({
    with: {
      validatedAddress: true,
    },
    where: eq(scrapsTable.id, scrapId),
  });
  let dadosDoLeilao = "";
  if (scrap) {
    dadosDoLeilao =
      "# Dados do Leilao\n```json\n" +
      JSON.stringify(
        {
          descricao_leiloeiro:
            scrap.description_markdown || scrap.description || undefined,
          endereco:
            scrap.validatedAddress?.formatted_address ??
            scrap.address ??
            undefined,
          avaliacao: scrap.appraisal ?? undefined,
          lance_atual: scrap.bid ?? undefined,
          data_primeira_praca: scrap.first_auction_date ?? undefined,
          lance_minimo_primeira_praca: scrap.first_auction_bid ?? undefined,
          data_segunda_praca: scrap.second_auction_date ?? undefined,
          lance_minimo_segunda_praca: scrap.second_auction_bid ?? undefined,
          numero_processo: scrap.case_number ?? undefined,
        },
        null,
        2,
      ) +
      "\n```\n\n";
  }

  let edital = "";
  if (scrap?.edital_file) {
    try {
      const documento = await extractTextWithAi(
        new SystemFile(scrap.edital_file),
      );
      edital =
        "# Edital\n```json\n" +
        JSON.stringify(documento, null, 2) +
        "\n```\n\n";
    } catch (error) {
      edital = "# Edital\n(Texto do edital não está disponível)";
      console.error(error);
    }
  }
  let matricula = "";
  if (scrap?.matricula_file) {
    try {
      const documento = await extractTextWithAi(
        new SystemFile(scrap.matricula_file),
      );
      matricula =
        "# Matrícula\n```json\n" +
        JSON.stringify(documento, null, 2) +
        "\n```\n\n";
    } catch (error) {
      matricula = "# Matrícula\n(Texto da matrícula não está disponível)";
      console.error(error);
    }
  }

  return `Você é um advogado especialista em leilões de imóveis em São Paulo (Brasil). Sua tarefa é responder perguntas sobre o leilão de um imóvel do qual você tem acesso a descrição do leiloeiro, edital e matrícula.

# Instruções
1. Leia a matrícula e o edital para entender o contexto do leilão.
2. Entenda a mensagem do usuário no contexto dos dados compartilhados.
3. Nunca responda perguntas que não foram feitas e nunca responda perguntas fora do contexto dos dados compartilhados.
4. Se a pergunta é sobre algo que está em um documento do leilão, inclua na sua resposta um trecho do documento e a página do documento como referência.

${dadosDoLeilao}
${edital}
${matricula}
  `;
}
