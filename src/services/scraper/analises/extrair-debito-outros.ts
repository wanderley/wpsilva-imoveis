import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

import { AnaliseDebitoExequendo } from "./extrair-debito-exequendo";

export type AnaliseDebitoOutros = {
  iptu: number;
  divida_ativa: number;
  condominio: number;
  outros: number;
};

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairDebitoOutros(
  contextoEdital: PromptContext,
  tipoExecucao: string,
  debitoExequendo: AnaliseDebitoExequendo,
): Promise<AnaliseDebitoOutros> {
  const debito = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    schema: z.object({
      iptu: z.number().describe("Valor do débito de IPTU em reais"),
      divida_ativa: z
        .number()
        .describe("Valor do débito de Dívida Ativa em reais"),
      condominio: z.number().describe("Valor do débito de Condomínio em reais"),
      outros: z.number().describe("Valor do débito de Outros em reais"),
    }),
    prompt: `${promptContextString("Contexto", [
      contextoEdital,
      {
        type: "informacao",
        props: [
          { name: "sobre", value: "Tipo de execução que originou o leilão" },
          { name: "origem", value: "Edital" },
        ],
        content: tipoExecucao,
      },
      {
        type: "json",
        props: [{ name: "tipo", value: "Débito exequendo" }],
        content: JSON.stringify(debitoExequendo, null, 2),
      },
    ])}
${PERSONA}
Sua tarefa é extrair os débitos que não se referem à hipoteca, à alienação fiduciária ou ao débito exequendo do edital.

### Passos
1. Leia o edital na íntegra.
2. Identifique o trecho do edital que menciona débitos referentes ao IPTU (débito pertinente ao imóvel perante a prefeitura).
  2a. Se o valor do IPTU for superior a zero, extraia o valor e classifique-o como "IPTU".
  2b. Se o valor do IPTU estiver somado ao da dívida ativa, extraia o valor total definindo-o como "IPTU".
  2c. Caso contrário, descarte essa informação referente ao IPTU.
3. Identifique o trecho que menciona débitos de Dívida Ativa.
  3a. Se o valor da dívida ativa for superior a zero, extraia o valor e classifique-o como "Dívida Ativa".
  3b. Se o valor da dívida ativa estiver somado ao da IPTU, descarte essa informação referente à Dívida Ativa.
4. Identifique o trecho do edital que menciona débitos associados a despesas de condomínio.
  4a. Se o débito estiver relacionado a uma execução classificada como "Cobrança de Despesas Condominiais", desconsidere-o.
  4b. Se o mesmo débito já constar na categoria de débito exequendo, desconsidere-o igualmente.
  4c. Caso nenhuma das condições anteriores se aplique, classifique-o como "Condomínio".
5. Identifique o trecho que menciona débitos de Outros.
  5a. Não inclua débitos de IPTU, Dívida Ativa, Condomínio, hipoteca ou alienação fiduciária.
  5b. Se o valor do outro débito for superior a zero, extraia o valor e classifique-o como "Outros".
  5c. Caso contrário, descarte essa informação referente ao Outros.
`,
  });
  return debito.object;
}
