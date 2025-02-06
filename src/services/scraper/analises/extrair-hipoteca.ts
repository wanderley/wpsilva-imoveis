import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import { generateObject, generateText } from "ai";
import { z } from "zod";

export type AnaliseHipoteca = {
  data_constituicao: string | null;
  credor: string;
  valor: number | null;
  ativo: boolean;
  justificativa: string;
};

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairHipoteca(
  contextoEdital: PromptContext,
  contextoMatricula: PromptContext,
): Promise<AnaliseHipoteca | null> {
  const trechoHipotecaNoEdital = await extrairHipotecaDoEdital(contextoEdital);
  if (!trechoHipotecaNoEdital) {
    return null;
  }

  const trechoHipotecaNaMatricula = await extrairHipotecaDaMatricula(
    contextoMatricula,
    trechoHipotecaNoEdital.text.trim(),
  );
  if (!trechoHipotecaNaMatricula) {
    return null;
  }

  const trechoCancelamentoDaHipotecaNaMatricula =
    await extrairTrechoCancelamentoDaHipotecaNaMatricula(
      contextoEdital,
      trechoHipotecaNaMatricula.text.trim(),
    );

  const hipoteca = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    schema: z.object({
      data_constituicao: z
        .string()
        .describe("Data de constituição da hipoteca no formato dd/mm/yyyy")
        .nullable(),
      credor: z.string().describe("Identificação do credor da hipoteca"),
      valor: z.number().describe("Valor da hipoteca em reais").nullable(),
      ativo: z
        .boolean()
        .describe(
          "Indicação se a hipoteca está ativa (true) ou cancelada/extinta (false)",
        ),
      justificativa: z
        .string()
        .describe("Justificativa sobre os dados coletados."),
    }),
    prompt: `${PERSONA}

Sua tarefa é analisar a situação da hipoteca e retornar os dados da hipoteca no formato de saída esperado.

### Passos
1. Analise o trecho do edital e da matrícula que mencionam a hipoteca.
2. Verifique se o valor da hipoteca está em reais.
  2a. Se o valor da hipoteca aparece no edital, use esse valor porque ele é mais atualizado.
  2b. Se o valor da hipoteca não aparece no edital, então use o valor que aparece na matrícula.
  2c. Se o valor da hipoteca não está em reais, então retorne null para o valor.
3. Verifique a data de constituição da hipoteca.
  3a. Se não conseguir identificar a data de constituição, então use a data do evento da matrícula.
  3b. Se ainda não conseguir identificar a data de constituição, então use a data que aparece no trecho do edital.
  3c. Caso contrário, retorne null para a data de constituição.
4. Verifique se a hipoteca está ativa ou cancelada/extinta.
  4a. Se existe um cancelamento da hipoteca na matrícula, então retorne false para o ativo.
  4b. Se existe o edital explicitamente mencionando que a hipoteca foi extinta (ex.: "hipoteca extingue-se pela arrematação ou adjudicação" ou menções ao Art. 1.499, VI/CC), então retorne false para o ativo.
  4c. Caso contrário, retorne true para o ativo.
5. Retorne os dados da hipoteca no formato de saída esperado.

${promptContextString("Dados", [
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Edital" }],
    content: trechoHipotecaNoEdital.text.trim(),
  },
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Matrícula" }],
    content: trechoHipotecaNaMatricula.text.trim(),
  },
  {
    type: "trecho-documento",
    props: [{ name: "nome", value: "Cancelamento da hipoteca" }],
    content: trechoCancelamentoDaHipotecaNaMatricula.text.trim(),
  },
])}`,
  });
  return hipoteca.object;
}

async function extrairHipotecaDoEdital(contextoEdital: PromptContext) {
  const trechoHipotecaNaEditalNaoEncontrado =
    "Nenhuma hipotéca foi encontrada no edital";
  const trechoHipotecaNoEdital = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${promptContextString("Contexto", [contextoEdital])}
${PERSONA}

### Passos
1. Leia o edital na íntegra para entender completamente o contexto do leilão.
2. Localize o trecho específico do edital que menciona hipotecas.
  2a. Não confunda hipoteca com alienação fiduciária, pois são dois eventos distintos.  
  2b. Caso não exista um trecho que mencione o registro da hipoteca na matrícula (por exemplo, "AV.N", "Av.N", "AV-N", "Av-N" ou "R.N."), retorne a mensagem "${trechoHipotecaNaEditalNaoEncontrado}".
3. Retorne apenas o trecho completo e na íntegra do edital que faz referência a hipoteca e nada mais.
`,
  });
  if (
    trechoHipotecaNoEdital.text.includes(trechoHipotecaNaEditalNaoEncontrado)
  ) {
    return null;
  }
  return trechoHipotecaNoEdital;
}

async function extrairHipotecaDaMatricula(
  contextoMatricula: PromptContext,
  trechoHipotecaNoEdital: string,
) {
  const trechoHipotecaNaMatriculaNaoEncontrado =
    "Nenhuma hipoteca foi encontrada na matrícula";
  const contexto = promptContextString("Contexto", [
    contextoMatricula,
    {
      type: "trecho-edital",
      props: [
        { name: "detalhes", value: "Trecho do edital que menciona a hipoteca" },
      ],
      content: trechoHipotecaNoEdital,
    },
  ]);
  const trechoHipotecaNaMatricula = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Leia a matrícula na íntegra para entender todos os eventos registrados.
2. Localize o trecho específico da matrícula que menciona a hipoteca.
  2a. Se o trecho incluir um número de registro (por exemplo, AV.N, Av.N, AV-N, Av-N ou R.N.), utilize esse número como ponto de referência para identificar com precisão o segmento da matrícula que menciona a hipoteca.
  2b. Se o número de registro não estiver presente, recorra à data de registro indicada no trecho do edital para localizar o segmento correspondente na matrícula.
  2c. Na ausência de ambos os critérios, identifique o registro mais recente na matrícula que se assemelhe à referência fornecida no edital e utilize-o para delimitar o segmento relacionado à hipoteca.
3. Retorne apenas o trecho completo e na íntegra da matrícula que faz referência a hipoteca e nada mais.
  3a. Caso não exista um trecho que mencione a hipoteca, retorne a mensagem "${trechoHipotecaNaMatriculaNaoEncontrado}"
`,
  });

  if (
    trechoHipotecaNaMatricula.text.includes(
      trechoHipotecaNaMatriculaNaoEncontrado,
    )
  ) {
    return null;
  }
  return trechoHipotecaNaMatricula;
}

async function extrairTrechoCancelamentoDaHipotecaNaMatricula(
  contextoMatricula: PromptContext,
  trechoHipotecaNaMatricula: string,
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
      content: trechoHipotecaNaMatricula,
    },
  ]);
  const trechoCancelamentoDaHipotecaNaMatriculaNaoEncontrado =
    "Nenhum cancelamento da hipoteca foi encontrado na matrícula";

  const trechoCancelamentoDaHipotecaNaMatricula = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Leia a matrícula na íntegra para entender todos os eventos registrados.
2. Localize o trecho específico da matrícula que menciona ao cancelamento da hipoteca.
3. Retorne apenas o trecho completo e na íntegra da matrícula que faz referência ao cancelamento da hipoteca e nada mais.
  3a. Caso não exista um trecho que mencione o cancelamento da hipoteca, retorne a mensagem "${trechoCancelamentoDaHipotecaNaMatriculaNaoEncontrado}" 
4. O registro de cancelamento tem que ser um novo registro na matrícula e deve contar uma menção explita ao cancelamento ou baixa da hipoteca.
`,
  });
  return trechoCancelamentoDaHipotecaNaMatricula;
}
