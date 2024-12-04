"use server";

import { db } from "@/db";
import {
  Scrap,
  openaiFilesTable,
  scrapAnalysesTable,
  scrapProfitTable,
} from "@/db/schema";
import { findScrapByID } from "@/features/auction/scrap/repository";
import {
  Schema,
  getAllKnowledge,
  getAllQuestions,
  schema,
} from "@/services/analyser/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export async function updateAnalysis(
  scrapId: number,
  model: "gpt-4o" | "gpt-4o-mini" = "gpt-4o-mini",
): Promise<void> {
  const scrap = await findScrapByID(scrapId);
  if (!scrap) {
    throw new Error("Scrap not found");
  }

  if (!scrap.edital_link) {
    console.error(`No edital link found for scrap ${scrapId}`);
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a thread
    const file_ids = await getOpenAIFileIDs(scrap);
    const prompt = getPrompt();
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: prompt,
          attachments: file_ids.map((file_id) => ({
            file_id: file_id,
            tools: [{ type: "file_search" }],
          })),
        },
      ],
    });

    const response_raw: string = await new Promise((resolve, reject) => {
      openai.beta.threads.runs
        .stream(thread.id, {
          assistant_id: process.env.SCRAPER_ANALYSER_OPENAI_ASSISTANT_ID!,
          model,
          top_p: 0.7,
          temperature: 0.3,
        })
        .on("textCreated", () => console.log("assistant >"))
        .on("toolCallCreated", (event) =>
          console.log(`assistant ${event.id}: ${event.type}`),
        )
        .on("messageDone", async (event) => {
          if (event.content[0].type === "text") {
            const { text } = event.content[0];
            resolve(text.value);
          } else {
            reject(new Error("Expected text response from OpenAI"));
          }
        })
        .on("error", reject);
    });

    const parsedText = await openai.beta.chat.completions.parse({
      model,
      messages: [{ role: "user", content: response_raw as string }],
      response_format: zodResponseFormat(schema, "analysis_result"),
    });

    const response = parsedText.choices[0].message.parsed;
    if (!response) {
      throw new Error("Failed to parse analysis result");
    }
    await db.insert(scrapAnalysesTable).values({
      scrap_id: scrapId,
      model,
      prompt,
      response,
      response_raw,
    });

    await updateCosts(scrapId, response);
  } catch (error) {
    console.error("Error requesting analysis:", error);
    throw new Error("Failed to request analysis");
  }
}

function getPrompt(): string {
  return `Você é um advogado especializado em leilões de imóveis no Brasil. Preciso da sua ajuda para responder às perguntas a seguir sobre este imóvel em leilão. Utilize apenas as informações encontradas nos arquivos fornecidos para responder.

### Perguntas
- ${getAllQuestions().join("\n- ")}

### Conhecimento adicional
- ${getAllKnowledge().join("\n- ")}

### Instruções Adicionais

1.  Responda cada pergunta com muita atenção e detalhe, citando o trecho do documento onde encontrou tal informação.
2.  Use apenas as informações disponíveis nos arquivos para responder.
3.	Se uma resposta não puder ser encontrada nos arquivos, escreva “não sei”.
4.	Revise suas respostas para garantir precisão e aponte qualquer inconsistência encontrada.
5.  Caso tenha encontrado inconsistências, responda as perguntas novamente corrigindo os erros.
6.	Além das respostas para cada pergunta, incluindo a descrição do trecho do documento onde encontrou a informação, inclua um JSON com as respostas, seguindo o JSON Schema abaixo:

<json-schema>
${JSON.stringify(zodResponseFormat(schema, "analysis_result"), null, 2)}
</json-schema>`;
}

async function getOpenAIFileIDs(scrap: Scrap): Promise<string[]> {
  const file_ids: string[] = [];
  if (scrap.edital_link) {
    file_ids.push(await getExistingFileID(scrap.edital_link, "edital.pdf"));
  }
  if (scrap.matricula_link) {
    file_ids.push(
      await getExistingFileID(scrap.matricula_link, "matricula.pdf"),
    );
  }
  if (scrap.laudo_link) {
    file_ids.push(await getExistingFileID(scrap.laudo_link, "laudo.pdf"));
  }
  if (scrap.description) {
    file_ids.push(await getDescriptionFileID(scrap.description));
  }
  return file_ids;
}

async function getDescriptionFileID(description: string): Promise<string> {
  const buffer = Buffer.from(description);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const file = await openai.files.create({
    file: new File([buffer], "description-from-auction-site.txt", {
      type: "text/plain",
    }),
    purpose: "assistants",
  });
  return file.id;
}

async function getExistingFileID(url: string, name: string): Promise<string> {
  const existingFile = await db.query.openaiFilesTable.findFirst({
    where: eq(openaiFilesTable.url, url),
  });
  if (existingFile) {
    return existingFile.file_id;
  }

  // Download file
  const response = await fetch(url);
  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Upload the file to OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const file = await openai.files.create({
    file: new File([buffer], name, { type: "application/pdf" }),
    purpose: "assistants",
  });

  await db.insert(openaiFilesTable).values({
    url,
    file_id: file.id,
  });

  return file.id;
}

async function updateCosts(scrapId: number, json: Schema): Promise<void> {
  const scrap = await findScrapByID(scrapId);
  const profit = scrap?.profit;
  if (!profit || profit.status === "overridden") {
    return;
  }
  const values = {
    custo_pos_imissao_divida_condominio:
      profit.custo_pos_imissao_divida_condominio,
    custo_pos_arrematacao_valor_condominio_mensal:
      profit.custo_pos_arrematacao_valor_condominio_mensal,
    custo_pos_imissao_divida_iptu: profit.custo_pos_imissao_divida_iptu,
    custo_pos_imissao_reforma: profit.custo_pos_imissao_reforma,
  };

  if (json.property_type === "Apartamento") {
    values.custo_pos_arrematacao_valor_condominio_mensal =
      (json.area.private || json.area.total) * 10;
  }
  switch (json.appraisal.type_of_reform) {
    case "Não precisa de reforma":
      values.custo_pos_imissao_reforma =
        10 * (json.area.private || json.area.total);
      break;
    case "Reforma simples":
      values.custo_pos_imissao_reforma =
        50 * (json.area.private || json.area.total);
      break;
    case "Indeterminado":
    case "Reforma pesada":
      values.custo_pos_imissao_reforma =
        100 * (json.area.private || json.area.total);
      break;
  }

  await db
    .update(scrapProfitTable)
    .set({ ...values })
    .where(eq(scrapProfitTable.scrap_id, scrapId));
}
