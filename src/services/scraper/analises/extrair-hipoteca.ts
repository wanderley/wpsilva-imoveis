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

  const contexto = promptContextString("Dados", [
    {
      type: "trecho-documento",
      props: [
        { name: "tipo", value: "Edital" },
        { name: "detalhes", value: "Trecho do edital que menciona a hipoteca" },
      ],
      content: trechoHipotecaNoEdital.text.trim(),
    },
    {
      type: "trecho-documento",
      props: [
        { name: "tipo", value: "Matrícula" },
        {
          name: "detalhes",
          value: "Trecho da matrícula que menciona a hipoteca",
        },
      ],
      content: trechoHipotecaNaMatricula.text.trim(),
    },
    {
      type: "pesquisa-em-documento",
      props: [
        { name: "documento", value: "Matrícula" },
        {
          name: "termo",
          value: "Penhora do credor hipotecário",
        },
      ],
      content: (
        await extrairPenhoraCredorHipotecarioNaMatricula(
          contextoMatricula,
          trechoHipotecaNaMatricula.text.trim(),
        )
      ).text.trim(),
    },
    {
      type: "trecho-documento",
      props: [
        { name: "tipo", value: "Matrícula" },
        {
          name: "detalhes",
          value:
            "Trecho **da matrícula** que menciona o cancelamento da hipoteca",
        },
      ],
      content: (
        await extrairTrechoCancelamentoDaHipotecaNaMatricula(
          contextoEdital,
          trechoHipotecaNaMatricula.text.trim(),
        )
      ).text.trim(),
    },
    {
      type: "trecho-documento",
      props: [
        { name: "documento", value: "Edital" },
        {
          name: "detalhes",
          value: "Trecho **do edital** que menciona o cancelamento da hipoteca",
        },
      ],
      content: (
        await extrairTrechoCancelamentoDaHipotecaNoEdital(
          contextoEdital,
          trechoHipotecaNoEdital.text.trim(),
        )
      ).text.trim(),
    },
  ]);
  const hipoteca = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
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
  2a. Se o edital informar o valor, use-o.
  2b. Caso contrário, se a matrícula mencionar penhora do credor, use o valor atualizado da ação (preferindo o valor de execução, se disponível).
  2c. Se não houver penhora, use o valor do registro na matrícula.
  2d. Se o valor não estiver em reais, retorne null.
3. Verifique a data de constituição da hipoteca.
  3a. Se não conseguir identificar a data de constituição, então use a data do evento do registro na matrícula.
  3b. Se ainda não conseguir identificar a data de constituição, então use a data que aparece no trecho do edital.
  3c. Caso contrário, retorne null para a data de constituição.
4. Determine se a hipoteca está ativa:
  a. Se houver cancelamento na matrícula, retorne false.
  b. Se o edital afirmar que a hipoteca está extinta (por exemplo, "hipoteca extingue-se pela arrematação ou adjudicação" ou referência ao Art. 1.499, VI/CC), retorne false.
  c. Se o edital indicar que a hipoteca foi liquidada, retorne false.
  d. Caso contrário, retorne true.
5. Detalhe de forma clara e precisa a origem de cada informação utilizada na justificativa, garantindo total rastreabilidade.
  5a. Padronize todas as datas para o formato dd/mm/yyyy.
  5b. Sempre que possível, inclua os números de registro pertinentes (por exemplo, Av.N, Av-N, R.N) para facilitar a identificação e verificação.
  5c. Se aplicável, especifique a seção ou parte exata do edital de onde a informação foi extraída.
6. Retorne os dados da hipoteca no formato de saída esperado.

${contexto}`,
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
  3a. Certifique-se de que o trecho retornado contenha o número de registro, identificável por formatos como AV.N, Av.N, AV-N, ou R.N.
  3b. Adicionalmente, inclua no trecho retornado a data de registro, utilizando o formato dd/mm/yyyy.
  3c. Caso não exista um trecho que mencione a hipoteca, retorne a mensagem "${trechoHipotecaNaMatriculaNaoEncontrado}"
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

async function extrairPenhoraCredorHipotecarioNaMatricula(
  contextoMatricula: PromptContext,
  trechoHipotecaNaMatricula: string,
) {
  const trechoPenhoraCredorHipotecarioNaMatriculaNaoEncontrado =
    "Nenhuma penhora do credor hipotecário foi encontrada na matrícula";
  const contexto = promptContextString("Contexto", [
    contextoMatricula,
    {
      type: "trecho-matricula",
      props: [
        {
          name: "detalhes",
          value: "Trecho da matrícula que menciona a hipoteca",
        },
      ],
      content: trechoHipotecaNaMatricula,
    },
  ]);
  return await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Analise cuidadosamente toda a matrícula, revisando cada registro para compreender todos os eventos documentados.
2. Identifique o registro **mais recente** que indique a penhora realizada exclusivamente pelo banco credor hipotecário na matrícula.  
  2a. Se o trecho contiver o nome exato do banco credor hipotecário, utilize essa informação para localizar o registro de penhora.  
  2b. Verifique se há variações ou atualizações no nome desse banco que possam indicar alterações, garantindo a identificação correta do registro.
3. Extraia e retorne somente o trecho completo da matrícula que contenha a referência à penhora, sem incluir informações adicionais.
  3a. Se nenhum registro de penhora for encontrado, retorne a mensagem "${trechoPenhoraCredorHipotecarioNaMatriculaNaoEncontrado}".
`,
  });
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
        { name: "documento", value: "Matrícula" },
        {
          name: "detalhes",
          value:
            "Trecho da hipoteca na matrícula para verificação de cancelamento",
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
4. O registro de cancelamento tem que ser um novo registro na matrícula e deve conter uma menção explita ao cancelamento ou baixa da hipoteca.
`,
  });
  return trechoCancelamentoDaHipotecaNaMatricula;
}

async function extrairTrechoCancelamentoDaHipotecaNoEdital(
  contextoEdital: PromptContext,
  trechoHipotecaNoEdital: string,
) {
  const contexto = promptContextString("Contexto", [
    contextoEdital,
    {
      type: "trecho-documento",
      props: [
        {
          name: "documento",
          value: "Edital",
        },
        {
          name: "detalhes",
          value: "Trecho do edital que menciona a hipoteca",
        },
      ],
      content: trechoHipotecaNoEdital,
    },
  ]);
  const trechoCancelamentoDaHipotecaNoEditalNaoEncontrado =
    "Nenhum cancelamento da hipoteca foi encontrado no edital";
  const trechoCancelamentoDaHipotecaNaMatricula = await generateText({
    model: openaiCached("gpt-4o-mini"),
    temperature: 0,
    prompt: `${contexto}
${PERSONA}

### Passos
1. Leia o edital na íntegra para entender completamente o contexto do leilão.
2. Localize o trecho específico do edital que menciona ao cancelamento/extinção/liquidação da hipoteca.
3. Retorne apenas o trecho completo e na íntegra do edital que faz referência ao cancelamento/extinção/liquidação da hipoteca e nada mais.
  3a. Caso não exista um trecho que mencione o cancelamento/extinção/liquidação da hipoteca, retorne a mensagem "${trechoCancelamentoDaHipotecaNoEditalNaoEncontrado}" 
`,
  });
  return trechoCancelamentoDaHipotecaNaMatricula;
}
