"use server";

import { db } from "@/db";
import { AnalysisResult } from "@/db/json";
import { openaiFilesTable, scrapsTable } from "@/db/schema";
import { getScrapDetails } from "@/models/scraps/actions";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export async function updateAnalysis(scrapId: number): Promise<void> {
  const scrap = await getScrapDetails(scrapId);
  if (!scrap) {
    throw new Error("Scrap not found");
  }

  if (!scrap.edital_link) {
    throw new Error("No edital link found");
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const file_ids: string[] = [];
    file_ids.push(await getFileID(scrap.edital_link, "edital.pdf"));
    if (scrap.matricula_link) {
      file_ids.push(await getFileID(scrap.matricula_link, "matricula.pdf"));
    }
    if (scrap.laudo_link) {
      file_ids.push(await getFileID(scrap.laudo_link, "laudo.pdf"));
    }

    // Create a thread
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Você é um advogado especializado em leilões de imóveis no Brasil. Preciso da sua ajuda para responder às perguntas a seguir sobre este imóvel em leilão. Utilize apenas as informações encontradas nos arquivos fornecidos para responder.

### Perguntas

- Qual é o tipo de imóvel? (Classifique como "apartamento", "casa", "terreno", "vaga de garagem", "direitos sobre o apartamento", etc.)
- Qual é a área total do imóvel em metros quadrados?
- Qual é a área construída do imóvel em metros quadrados?
- Qual é o endereço completo do imóvel? (Inclua rua, número, bairro, cidade, estado e CEP)
- O imóvel possui vaga de garagem? (Para apartamentos, verifique se o edital menciona explicitamente. Para casas, considere "sim" por padrão)
- Qual é a modalidade da propriedade do imóvel? (Classifique como "Propriedade plena", "Nua-propriedade", etc.)
- Quais dívidas serão pagas com o produto da venda judicial?
- Qual é o trecho do documento que menciona a dívida de IPTU e seu pagamento?
- Como a dívida de IPTU será paga? (Classifique como "arrematante", "proprietário" ou "produto da venda judicial")
- Qual valor da dívida de IPTU que será paga pelo arrematante?  (Responda com 0 se a dívida não for paga pelo arrematante)
- Qual é o trecho do documento que menciona a dívida de condomínio e seu pagamento?
- Como a dívida de condomínio será paga? (Classifique como "arrematante", "proprietário" ou "produto da venda judicial")
- Qual valor da dívida de condomínio que será paga pelo arrematante?  (Responda com 0 se a dívida não for paga pelo arrematante)
- Existem penhoras registradas para este imóvel? (Liste as penhoras e, para cada uma, indique o impacto na aquisição do imóvel) Inclua somente se tiver absoluta certeza das penhoras que podem atrapalhar a arrematação.
- O edital ou a matrícula indicam se o ocupante do imóvel é um invasor reivindicando usucapião?
- Qual é a condição geral do imóvel? (Classifique como "ruim", "boa" ou "ótima" com base na descrição do laudo)
- Que tipo de reforma é necessária no imóvel? (Classifique como "não precisa de reforma", "reforma simples" ou "reforma pesada" com base na descrição do laudo.  Se o laudo não for explícito sobre a reforma, basei-se pela condição geral do imóvel)
- O imóvel está ocupado no momento?

### Instruções Adicionais

1.  Responda cada pergunta com muita atenção e detalhe, citando o trecho do documento onde encontrou tal informação.
2.  Use apenas as informações disponíveis nos arquivos para responder.
3.	Se uma resposta não puder ser encontrada nos arquivos, escreva “não sei”.
4.	Revise suas respostas para garantir precisão e aponte qualquer inconsistência encontrada.
5.  Caso tenha encontrado inconsistências, responda as perguntas novamente corrigindo os erros.
6.	Além das respostas para cada pergunta, incluindo a descrição do trecho do documento onde encontrou a informação, inclua um JSON com as respostas, seguindo o JSON Schema abaixo:

<json-schema>
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ImovelDataSchema",
  "type": "object",
  "properties": {
    "tipo_imovel": {
      "type": "string",
      "enum": ["Apartamento", "Casa", "Terreno", "Vaga de garagem", "Direitos sobre o apartamento", "Imóvel comercial", "Outro"],
      "description": "Tipo do imóvel, como apartamento, casa, terreno, vaga de garagem, etc."
    },
    "tamanho_imovel_m2": {
      "type": "number",
      "description": "Área total do imóvel em metros quadrados"
    },
    "area_construida_m2": {
      "type": "number",
      "description": "Área construída do imóvel em metros quadrados"
    },
    "endereco_completo": {
      "type": "string",
      "description": "Endereço completo do imóvel, incluindo rua, número, bairro, cidade, estado e CEP"
    },
    "endereco": {
      "type": "object",
      "properties": {
        "rua": {
          "type": "string",
          "description": "Nome da rua"
        },
        "numero": {
          "type": "string",
          "description": "Número do imóvel"
        },
        "bairro": {
          "type": "string",
          "description": "Nome do bairro"
        },
        "cidade": {
          "type": "string",
          "description": "Nome da cidade"
        },
        "estado": {
          "type": "string",
          "description": "Sigla do estado"
        },
        "cep": {
          "type": "string",
          "description": "CEP do imóvel",
          "pattern": "^\\d{5}-?\\d{3}$"
        }
      },
      "required": ["rua", "numero", "bairro", "cidade", "estado", "cep"]
    },
    "vaga_garagem": {
      "type": "string",
      "enum": ["Sim", "Não", "Não especificado"],
      "description": "Indica se o imóvel inclui vaga de garagem"
    },
    "modalidade_propriedade": {
      "type": "string",
      "enum": ["Propriedade plena", "Nua-propriedade", "Outro"],
      "description": "Modalidade da propriedade do imóvel, como Propriedade Plena, Nua-Propriedade, etc."
    },
    "divida_iptu": {
      "type": "number",
      "description": "Valor da dívida de IPTU registrada para este imóvel que não será paga com o produto da venda judicial.  Responda com 0 se não tiver dívida de IPUT de responsabilidade do arrematante."
    },
    "divida_condominio": {
      "type": "number",
      "description": "Valor da dívida de condomínio registrada para este imóvel que não será paga com o produto da venda judicial.  Responda com 0 se não tiver dívida de condomínio de responsabilidade do arrematante."
    },
    "penhoras": {
      "type": "array",
      "description": "Lista de penhoras registradas para o imóvel",
      "items": {
        "type": "object",
        "properties": {
          "descricao_penhora": {
            "type": "string",
            "description": "Descrição detalhada da penhora e seu impacto para o arrematante"
          },
          "documento_mencionado": {
            "type": "string",
            "description": "Documento que menciona a penhora (exemplo: Edital, Matrícula ou Laudo)"
          },
          "trecho_documento": {
            "type": "string",
            "description": "Trecho do documento que menciona a penhora com no mínimo 20 palavras e no máximo 100 palavras"
          }
        },
        "required": ["descricao_penhora", "documento_mencionado", "trecho_documento"]
      }
    },
    "ocupacao_usucapiao": {
      "type": "string",
      "enum": ["Sim", "Não", "Não especificado"],
      "description": "Indica se o ocupante é um invasor reivindicando usucapião"
    },
    "condicao_geral": {
      "type": "string",
      "enum": ["Ruim", "Boa", "Ótima"],
      "description": "Condição geral do imóvel"
    },
    "tipo_reforma": {
      "type": "string",
      "enum": ["Não precisa de reforma", "Reforma simples", "Reforma pesada"],
      "description": "Tipo de reforma necessária no imóvel"
    },
    "imovel_ocupado": {
      "type": "string",
      "enum": ["Sim", "Não"],
      "description": "Indica se o imóvel está ocupado no momento"
    }
  },
  "required": [
    "tipo_imovel",
    "tamanho_imovel_m2",
    "area_construida_m2",
    "endereco_completo",
    "endereco",
    "vaga_garagem",
    "modalidade_propriedade",
    "divida_iptu",
    "divida_condominio",
    "penhoras",
    "ocupacao_usucapiao",
    "condicao_geral",
    "tipo_reforma",
    "imovel_ocupado"
  ]
}
</json-schema>`,
          attachments: file_ids.map((file_id) => ({
            file_id: file_id,
            tools: [{ type: "file_search" }],
          })),
        },
      ],
    });

    const text = await new Promise((resolve, reject) => {
      openai.beta.threads.runs
        .stream(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID!,
          model: "gpt-4o-mini",
        })
        .on("textCreated", () => console.log("assistant >"))
        .on("toolCallCreated", (event) =>
          console.log(`assistant ${event.id}: ${event.type}`),
        )
        .on("messageDone", async (event) => {
          if (event.content[0].type === "text") {
            const { text } = event.content[0];
            resolve(text.value);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    const parsedText = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: text as string }],
      response_format: zodResponseFormat(AnalysisResult, "analysis_result"),
    });

    const json = parsedText.choices[0].message.parsed;
    if (!json) {
      throw new Error("Failed to parse analysis result");
    }
    await db
      .update(scrapsTable)
      .set({
        analysis_status: "done",
        analysis_result_json: json,
        analysis_result_text: text as string,
      })
      .where(eq(scrapsTable.id, scrapId));

    await updateCosts(scrapId, json);
  } catch (error) {
    console.error("Error requesting analysis:", error);
    throw new Error("Failed to request analysis");
  }
}

async function getFileID(url: string, name: string): Promise<string> {
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

async function updateCosts(
  scrapId: number,
  json: AnalysisResult,
): Promise<void> {
  const scrap = await getScrapDetails(scrapId);
  if (!scrap || scrap.potential_profit_status === "overridden") {
    return;
  }
  const values = {
    custo_pos_imissao_divida_condominio:
      scrap.custo_pos_imissao_divida_condominio,
    custo_pos_arrematacao_valor_condominio_mensal:
      scrap.custo_pos_arrematacao_valor_condominio_mensal,
    custo_pos_imissao_divida_iptu: scrap.custo_pos_imissao_divida_iptu,
    custo_pos_imissao_reforma: scrap.custo_pos_imissao_reforma,
  };

  if (json.analysis_result.tipo_imovel === "Apartamento") {
    values.custo_pos_arrematacao_valor_condominio_mensal =
      json.analysis_result.area_construida_m2 * 10;
  }
  switch (json.analysis_result.tipo_reforma) {
    case "Não precisa de reforma":
      values.custo_pos_imissao_reforma =
        10 * json.analysis_result.area_construida_m2;
      break;
    case "Reforma simples":
      values.custo_pos_imissao_reforma =
        50 * json.analysis_result.area_construida_m2;
      break;
    case "Reforma pesada":
      values.custo_pos_imissao_reforma =
        100 * json.analysis_result.area_construida_m2;
      break;
  }

  await db
    .update(scrapsTable)
    .set({ ...values })
    .where(eq(scrapsTable.id, scrapId));
}
