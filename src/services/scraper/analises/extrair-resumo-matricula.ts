import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

export type AnaliseResumoMatricula = {
  numero_penhoras_ativas: number;
  eventos: string[];
};

const PERSONA = `Você é um especialista em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairResumoMatricula(
  contextoMatricula: PromptContext,
): Promise<AnaliseResumoMatricula> {
  const matricula = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    schema: z.object({
      numero_penhoras_ativas: z
        .number()
        .describe("Número de penhoras ativas na matrícula"),
      eventos: z
        .array(z.string().describe("Breve descrição do evento."))
        .describe("Eventos da matrícula"),
    }),
    prompt: `${promptContextString("Contexto", [contextoMatricula])}
${PERSONA}
Sua tarefa é analisar a matrícula e resumir os eventos da matrícula.

### Passos
1. Leia a matrícula na íntegra.
2. Identifique **todos** os eventos da matrícula.
3. Para cada evento, inclua o seguinte na descrição do evento:
  3a. O número de registro do evento.
  3b. Inclua a data do evento.
  3c. Inclua o tipo de evento: penhora, hipoteca, alienação fiduciária, etc.
  3d. Inclua valores se houver.
  3e. Inclua o número do processo se houver.
  3f. A descrição deve ser feita em uma sentença organizada e simples de entender (ex. "Av.N: Penhora ..." ou "R.N: Registro ...").`,
  });
  return matricula.object;
}
