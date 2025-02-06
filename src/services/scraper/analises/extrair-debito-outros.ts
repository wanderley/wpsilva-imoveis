import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

export type AnaliseDebitoOutros = {
  tipo: "IPTU" | "Dívida Ativa" | "Condomínio" | "Outros";
  valor: number;
}[];

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairDebitoOutros(
  contextoEdital: PromptContext,
): Promise<AnaliseDebitoOutros> {
  const debito = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    output: "array",
    schema: z.object({
      tipo: z
        .enum(["IPTU", "Dívida Ativa", "Condomínio", "Outros"])
        .describe("Tipo de débito"),
      valor: z.number().describe("Valor do débito em reais"),
    }),
    prompt: `${promptContextString("Contexto", [contextoEdital])}
${PERSONA}
Sua tarefa é extrair os débitos que não se referem à hipoteca, à alienação fiduciária ou ao débito exequendo do edital.

### Passos
1. Leia o edital na íntegra.
2. Localize o trecho que menciona débitos que não se referem à hipoteca, à alienação fiduciária ou ao débito exequendo.
  2a. Foque em identificar informações sobre débitos referentes a IPTU, Dívida Ativa, despesas de condomínio ou outros encargos.
  2b. Se não for possível identificar o valor exato de algum débito, não o inclua na lista de retorno.
3. Verifique se há menção a débitos referentes a despesas de condomínio.
  3a. Se o nome do autor na ação judicial indicar que a ação é movida pelo próprio condomínio, descarte esse débito para que não seja classificado como "outros" débitos.
4. Ao extrair os débitos, inclua apenas aqueles cujo valor seja maior que zero; descarte qualquer débito cujo valor seja zero.
`,
  });
  return debito.object.filter((debito) => debito.valor > 0);
}
