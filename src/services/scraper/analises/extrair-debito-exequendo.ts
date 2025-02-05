import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

export type AnaliseDebitoExequendo = {
  debito_exequendo: number;
  despesa_condominio: boolean;
  justificativa: string;
};

const PERSONA = `Você é um especialista em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairDebitoExequendo(
  contextoEdital: PromptContext,
): Promise<AnaliseDebitoExequendo> {
  const debito = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    schema: z.object({
      debito_exequendo: z
        .number()
        .describe("Valor do débito exequendo em reais"),
      despesa_condominio: z
        .boolean()
        .describe("Indicação se o débito é uma despesa de condomínio"),
      justificativa: z
        .string()
        .describe("Justificativa sobre os dados coletados."),
    }),
    prompt: `${promptContextString("Contexto", [contextoEdital])}
${PERSONA}
Sua tarefa é extrair o valor do débito exequendo do edital.

### Passos
1. Leia o edital na íntegra.
2. Localize o trecho que menciona o débito exequendo.
  2a. Não confunda o débito exequendo com o valor da hipoteca ou da alienação fiduciária que aparecerem na seção de ônus no edital.
  2b. Se não conseguir identificar o valor do débito exequendo, retorne zero e inclua uma justificativa para não ter conseguido identificar o valor.  
3. Verifique se o débito é relacionado a dívidas de condomínio.
  3a. Como não temos acesso ao processo, então vamos assumir que ações movidas por condomínios são despesas de condomínio.
    3a1. Identifique o nome do autor da ação judicial.
    3a2. Verifique se o nome do autor da ação é o nome de um condomínio. Normalmente, você encontrará a palavra "condominio" no nome do autor da ação.
    3a3. Caso identifique que o autor da ação é um condomínio, considere o débito como uma despesa de condomínio.
  3b. Caso contrário, assuma que o débito **não é uma despesa de condomínio**.`,
  });
  return debito.object;
}
