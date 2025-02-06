import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

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
  const trechoAlienacaoFiduriciariaNoEdital =
    await extrairTrechoAlienacaoFiduriciariaNoEdital(contextoEdital);

  if (!trechoAlienacaoFiduriciariaNoEdital) {
    return null;
  }

  const trechoAlienacaoFiduciariaNaMatricula =
    await extrairTrechoAlienacaoFiduciariaNaMatricula(
      contextoMatricula,
      trechoAlienacaoFiduriciariaNoEdital.text.trim(),
    );

  const trechoCancelamentoDaAlienacaoFiduciariaNaMatricula =
    await extrairTrechoCancelamentoDaAlienacaoFiduciariaNaMatricula(
      contextoMatricula,
      trechoAlienacaoFiduciariaNaMatricula.text.trim(),
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

Sua tarefa é analisar a situação da alienação fiduciária e retornar os dados da alienação fiduciária no formato de saída esperado.

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

async function extrairTrechoAlienacaoFiduriciariaNoEdital(
  contextoEdital: PromptContext,
) {
  const trechoAlienacaoFiduciariaNoEditalNaoEncontrado =
    "Nenhuma alienação fiduciária foi encontrada **no edital**";
  const trechoAlienacaoFiduriciariaNoEdital = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${promptContextString("Contexto", [contextoEdital])}
${PERSONA}

### Passos

1. Leia o edital na íntegra para entender completamente o contexto do leilão.
2. Localize o trecho específico do edital que menciona alienação/débito fiduciário.
  2a. Não confunda hipoteca com alienação/débito fiduciária, pois são dois eventos distintos.  
  2b. Caso não exista um trecho que mencione a alienação/débito fiduciário no edital (por exemplo, "AV.N", "Av.N", "AV-N", "Av-N" ou "R.N."), retorne a mensagem "${trechoAlienacaoFiduciariaNoEditalNaoEncontrado}".
3. Retorne apenas o trecho completo e na íntegra do edital que faz referência a alienação/débito fiduciário e nada mais.
`,
  });

  if (
    trechoAlienacaoFiduriciariaNoEdital.text.includes(
      trechoAlienacaoFiduciariaNoEditalNaoEncontrado,
    )
  ) {
    return null;
  }
  return trechoAlienacaoFiduriciariaNoEdital;
}

async function extrairTrechoAlienacaoFiduciariaNaMatricula(
  contextoMatricula: PromptContext,
  trechoAlienacaoFiduriciariaNoEdital: string,
) {
  const trechoAlienacaoFiduciariaNaMatriculaNaoEncontrado =
    "Nenhuma alienação fiduciária foi encontrada na matrícula";
  const contexto = promptContextString("Contexto", [
    contextoMatricula,
    {
      type: "trecho-edital",
      props: [
        {
          name: "detalhes",
          value: "Trecho do edital que menciona a alienação fiduciária",
        },
      ],
      content: trechoAlienacaoFiduriciariaNoEdital,
    },
  ]);
  return await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Leia a matrícula na íntegra para entender todos os eventos registrados.
2. Localize o trecho específico da matrícula que menciona a alienação fiduciária.
  2a. Se o trecho incluir um número de registro (por exemplo, AV.N, Av.N, AV-N, Av-N ou R.N.), utilize esse número como ponto de referência para identificar com precisão o segmento da matrícula que menciona a alienação fiduciária.
  2b. Se o número de registro não estiver presente, recorra à data de registro indicada no trecho do edital para localizar o segmento correspondente na matrícula.
  2c. Na ausência de ambos os critérios, identifique o registro mais recente na matrícula que se assemelhe à referência fornecida no edital e utilize-o para delimitar o segmento relacionado à alienação fiduciária.
3. Retorne apenas o trecho completo e na íntegra da matrícula que faz referência a alienação fiduciária e nada mais.
  3a. Caso não exista um trecho que mencione a alienação fiduciária, retorne a mensagem "${trechoAlienacaoFiduciariaNaMatriculaNaoEncontrado}"
`,
  });
}

async function extrairTrechoCancelamentoDaAlienacaoFiduciariaNaMatricula(
  contextoMatricula: PromptContext,
  trechoAlienacaoFiduciariaNaMatricula: string,
) {
  const contexto = promptContextString("Contexto", [
    contextoMatricula,
    {
      type: "trecho-documento",
      props: [
        {
          name: "nome",
          value: "matricula-para-verificacao-cancelamento",
        },
      ],
      content: trechoAlienacaoFiduciariaNaMatricula,
    },
  ]);
  const trechoCancelamentoDaAlienacaoFiduciariaNaMatriculaNaoEncontrado =
    "Nenhum cancelamento da alienação fiduciária foi encontrada na matrícula";
  return await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Leia a matrícula na íntegra para entender todos os eventos registrados.
2. Localize o trecho específico da matrícula que menciona o cancelamento da alienação fiduciária.
3. Retorne apenas o trecho completo e na íntegra da matrícula que faz referência ao cancelamento da alienação fiduciária e nada mais.
  3a. Caso não exista um trecho que mencione o cancelamento da alienação fiduciária, retorne a mensagem "${trechoCancelamentoDaAlienacaoFiduciariaNaMatriculaNaoEncontrado}" 
4. O registro de cancelamento tem que ser um novo registro na matrícula e deve conter uma menção explita ao cancelamento ou baixa da alienação fiduciária.
`,
  });
}
