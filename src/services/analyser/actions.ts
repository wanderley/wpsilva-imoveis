"use server";

import { db } from "@/db";
import { scrapsTable } from "@/db/schema";
import { getScrapDetails } from "@/models/scraps/actions";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

export async function requestAnalysis(scrapId: number): Promise<void> {
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
    // Download the edital file
    const response = await fetch(scrap.edital_link);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Upload the file to OpenAI
    const file = await openai.files.create({
      file: new File([buffer], "edital.pdf", { type: "application/pdf" }),
      purpose: "assistants",
    });

    // Create a thread
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Identifique débitos e ônus associados a um bem em leilão, como IPTU e dívida ativa, e analise as responsabilidades do arrematante quanto a essas obrigações.

### Steps

1. **Identificação de Débitos e Ônus:**
   - Liste todos os débitos e ônus associados ao bem, incluindo impostos como IPTU e dívidas ativas.
   - Inclua quaisquer outras obrigações conhecidas ou registradas.

2. **Responsabilidade do Arrematante:**
   - Analise quais obrigações e ônus serão transferidos ao arrematante.
   - Identifique quais responsabilidades continuarão pertencendo ao proprietário anterior.

3. **Análise da Matrícula do Imóvel:**
   - Verifique a matrícula atualizada do imóvel.
   - Identifique qualquer presença de penhoras, ônus ou gravames adicionais.

4. **Score de arrematação:**
   - Calcule um score de arrematação que indica o quão seguro é arrematar esse imóvel: risco alto, risco médio, risco baixo e sem risco.

### Output Format

Forneça a resposta em formato de texto (bullet points) com as seguintes seções claramente delineadas:
- **Débitos e Ônus Identificados**
- **Responsabilidades do Arrematante**
- **Análise da Matrícula do Imóvel**
- **Score de arrematação**

### Examples

**Entrada:**
Uma propriedade residencial com possíveis dívidas de IPTU e suspeitas de penhora devido a empréstimos não pagos.

**Saída Esperada:**

- **Débitos e Ônus Identificados:** O imóvel possui uma dívida ativa com IPTU no valor de R$ [valor] e uma penhora registrada devido a não pagamento de um empréstimo no valor de R$ [valor].
- **Responsabilidades do Arrematante:** O arrematante assumirá as dívidas de IPTU e a penhora registrada, conforme as condições descritas no edital de leilão.
- **Análise da Matrícula do Imóvel:** Na matrícula atualizada, foi confirmada a existência de uma penhora no valor de R$ [valor].
- **Score de arrematação:** risco alto.

### Notes

- Assegure-se de verificar todos os registros relevantes para garantir uma identificação precisa dos débitos e ônus.
- Considerar possíveis alterações recentes e contextuais, até a data limite do treinamento (outubro de 2023).`,
          attachments: [{ file_id: file.id, tools: [{ type: "file_search" }] }],
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

    await db
      .update(scrapsTable)
      .set({
        analysis_status: "done",
        analysis_thread_id: thread.id,
        analysis_result: text as string,
      })
      .where(eq(scrapsTable.id, scrapId));
  } catch (error) {
    console.error("Error requesting analysis:", error);
    throw new Error("Failed to request analysis");
  }
}