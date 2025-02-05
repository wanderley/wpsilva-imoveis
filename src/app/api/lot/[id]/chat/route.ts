import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import {
  gerarContextoEdital,
  gerarContextoMatricula,
} from "@/services/scraper/lib/gerar-contexto";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { eq } from "drizzle-orm";

// Allow streaming responses up to 5 minutes
// since it can take a while to generate the
// system message for the first time
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, scrapId } = await req.json();
  const system = await getSystemMessage(scrapId);
  const result = streamText({
    model: openai("gpt-4o-mini"),
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
  const contexto: PromptContext[] = [];
  if (scrap) {
    const descricaoLeiloeiro = scrap.description_markdown || scrap.description;
    if (descricaoLeiloeiro) {
      contexto.push({
        type: "documento",
        props: [{ name: "nome", value: "Descrição do leiloeiro" }],
        content: descricaoLeiloeiro,
      });
    }
    const dataString = JSON.stringify(
      {
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
        numero_processo_judicial: scrap.case_number ?? undefined,
      },
      null,
      2,
    );
    contexto.push({
      type: "json",
      props: [
        { name: "nome", value: "Dados encontrados no site do leiloeiro" },
      ],
      content: dataString,
    });
  }
  if (scrap?.edital_file) {
    try {
      contexto.push(await gerarContextoEdital(scrap.edital_file));
    } catch (error) {
      contexto.push({
        type: "documento",
        props: [{ name: "nome", value: "Edital" }],
        content: "Texto do edital não está disponível",
      });
      console.error(error);
    }
  }
  if (scrap?.matricula_file) {
    try {
      contexto.push(await gerarContextoMatricula(scrap.matricula_file));
    } catch (error) {
      contexto.push({
        type: "documento",
        props: [{ name: "nome", value: "Matrícula" }],
        content: "Texto da matrícula não está disponível",
      });
      console.error(error);
    }
  }

  return `Você é um advogado especialista em leilões de imóveis em São Paulo (Brasil). Sua tarefa é responder perguntas sobre o leilão de um imóvel do qual você tem acesso a descrição do leiloeiro, edital e matrícula.

# Instruções
1. Leia a matrícula e o edital para entender o contexto do leilão.
2. Entenda a mensagem do usuário no contexto dos dados compartilhados.
3. Nunca responda perguntas que não foram feitas e nunca responda perguntas fora do contexto dos dados compartilhados.
4. Se a pergunta é sobre algo que está em um documento do leilão, inclua na sua resposta um trecho do documento e a página do documento como referência.

${promptContextString("Dados", contexto)}
  `;
}
