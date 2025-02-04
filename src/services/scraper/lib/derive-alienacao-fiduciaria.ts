import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const PERSONA = `Você é um especialista em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export type AnaliseAlienacaoFiduciaria = {
  data_constituicao: string | null;
  credor: string;
  valor: number | null;
  ativo: boolean;
  justificativa: string;
};

export async function extrairAlienacaoFiduciaria(
  contextoEdital: PromptContext,
  contextoMatricula: PromptContext,
): Promise<AnaliseAlienacaoFiduciaria | null> {
  const promptTemplate = ({
    contexto,
    persona,
    oDocumento,
    aAlienacaoFiduciaria,
    passosAdicionais,
    naoHaAlienacaoFiduciaria,
  }: {
    [K in
      | "contexto"
      | "persona"
      | "oDocumento"
      | "aAlienacaoFiduciaria"
      | "passosAdicionais"
      | "naoHaAlienacaoFiduciaria"]: string;
  }) => `${contexto}
${persona}

### Passos
1. Leia ${oDocumento} na íntegra para entender completamente o documento.
2. Localize o trecho específico d${oDocumento} que menciona ${aAlienacaoFiduciaria}.
3. Retorne apenas o trecho completo e na íntegra d${oDocumento} que faz referência ${aAlienacaoFiduciaria} e nada mais.
  3a. Caso não exista um trecho que mencione ${aAlienacaoFiduciaria}, retorne a mensagem "${naoHaAlienacaoFiduciaria}".
${passosAdicionais}`;

  const trechoAlienacaoFiduciariaNoEditalNaoEncontrado =
    "Nenhuma alienação fiduciária foi encontrada **no edital**";
  const trechoAlienacaoFiduriciariaNoEdital = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: promptTemplate({
      contexto: promptContextString("Contexto", [contextoEdital]),
      persona: PERSONA,
      oDocumento: "o edital",
      aAlienacaoFiduciaria: "a alienação fiduciária",
      naoHaAlienacaoFiduciaria: trechoAlienacaoFiduciariaNoEditalNaoEncontrado,
      passosAdicionais: "",
    }),
  });

  if (
    trechoAlienacaoFiduriciariaNoEdital.text.includes(
      trechoAlienacaoFiduciariaNoEditalNaoEncontrado,
    )
  ) {
    return null;
  }

  const trechoAlienacaoFiduciariaNaMatricula = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: promptTemplate({
      contexto: promptContextString("Contexto", [contextoMatricula]),
      persona: PERSONA,
      oDocumento: "a matrícula",
      aAlienacaoFiduciaria: "a alienação fiduciária",
      naoHaAlienacaoFiduciaria:
        "Nenhuma alienação fiduciaria foi encontrada **na matrícula**",
      passosAdicionais: "",
    }),
  });

  const trechoCancelamentoDaAlienacaoFiduciariaNaMatricula = await generateText(
    {
      model: openaiCached("gpt-4o-mini"),
      temperature: 0,
      prompt: promptTemplate({
        contexto: promptContextString("Contexto", [
          contextoMatricula,
          {
            type: "trecho-documento",
            props: [
              {
                name: "nome",
                value: "matricula-para-verificacao-cancelamento",
              },
            ],
            content: trechoAlienacaoFiduciariaNaMatricula.text.trim(),
          },
        ]),
        persona: PERSONA,
        oDocumento: "a matrícula",
        aAlienacaoFiduciaria: "ao cancelamento da alienação fiduciária",
        naoHaAlienacaoFiduciaria:
          "Nenhum cancelamento da alienação fiduciária foi encontrado **na matrícula**",
        passosAdicionais:
          "4. O registro de cancelamento tem que ser um novo registro na matrícula e deve contar uma menção explita ao cancelamento ou baixa da alienação fiduciária.",
      }),
    },
  );

  const alienacaoFiduciaria = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    schema: z.object({
      data_constituicao: z
        .string()
        .describe(
          "Data de constituição da alienação fiduciária no formato dd/mm/yyyy",
        )
        .nullable(),
      credor: z
        .string()
        .describe("Identificação do credor da alienação fiduciária"),
      valor: z
        .number()
        .describe("Valor da alienação fiduciária em reais")
        .nullable(),
      ativo: z
        .boolean()
        .describe(
          "Indicação se a alienação fiduciária está ativa (true) ou cancelada/extinta (false)",
        ),
      justificativa: z
        .string()
        .describe("Justificativa sobre os dados coletados."),
    }),
    prompt: `${PERSONA}

Sua tarefa é analisar a situação da hipoteca e retornar os dados da hipoteca no formato de saída esperado.

### Passos
1. Analise o trecho do edital e da matrícula que mencionam a alienação fiduciária.
2. Verifique se o valor da alienação fiduciária está em reais.
  2a. Se o valor da alienação fiduciária aparece no edital, use esse valor pois é mais atualizado.
  2b. Se o valor da alienação fiduciária não aparece no edital, use o valor que aparece na matrícula.
  2c. Se o valor da alienação fiduciária não está em reais, então retorne null para o valor.
3. Verifique a data de constituição da alienação fiduciária.
  3a. Se não conseguir identificar a data de constituição, então use a data do evento da matrícula.
  3b. Se ainda não conseguir identificar a data de constituição, então use a data que aparece no trecho do edital.
  3c. Caso contrário, retorne null para a data de constituição.
4. Verifique se a alienação fiduciária está ativa ou cancelada/extinta.
  4a. Se não houver alienação fiduciária no edital, então retorne false para o ativo.
  4b. Se existe um cancelamento da alienação fiduciária na matrícula, então retorne false para o campo ativo ativo.
  4c. Se o edital explicitamente mencionar que a alienação fiduciária foi extinta, então retorne false para o ativo.
  4d. Caso contrário, retorne true para o ativo.
5. Retorne os dados da alienação fiduciária no formato de saída esperado.

${promptContextString("Dados", [
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Edital" }],
    content: trechoAlienacaoFiduriciariaNoEdital.text.trim(),
  },
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Matrícula" }],
    content: trechoAlienacaoFiduciariaNaMatricula.text.trim(),
  },
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Cancelamento da alienação fiduciária" }],
    content: trechoCancelamentoDaAlienacaoFiduciariaNaMatricula.text.trim(),
  },
])}`,
  });
  return alienacaoFiduciaria.object;
}
