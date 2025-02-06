import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { openaiCached } from "@/services/ai/providers";
import {
  TipoExecucao,
  tipoExecucaoEnum,
} from "@/services/scraper/analises/consts";
import { generateObject } from "ai";

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairTipoExecucao(contextoEdital: PromptContext) {
  const debito = await generateObject({
    model: openaiCached("gpt-4o-mini"),
    output: "enum",
    enum: tipoExecucaoEnum as unknown as TipoExecucao[],
    prompt: `${promptContextString("Contexto", [contextoEdital])}
${PERSONA}
Sua tarefa é classificar o edital em uma das seguintes categorias: "Execução Hipotecária", "Cobrança de Despesas Condominiais", "Execução Trabalhista", "Leilão Extrajudicial (Alienação Fiduciária)" ou "Outras Execuções".

### Passos
1. Leia o edital na íntegra.
2. Classifique o edital, atribuindo-o a uma das seguintes categorias:
  - Execução hipotecária: Leilão derivado de execução judicial que utiliza garantias hipotecárias.
    Critérios:
      - Menções isoladas à hipoteca não são suficientes para classificar o edital como execução hipotecária.
      - Procure explicitamente pela expressão "execução hipotecária" ou termos equivalentes.
      - Verifique a presença de nomes de bancos atuando como exequente da ação.  
  - Cobrança de despesas condominiais: Designa processos em que o débito decorre da cobrança de encargos condominiais.
    Critérios:
      - A ação deve ser proposta por um condomínio ou indicar explicitamente que se trata de despesas condominiais.
      - No nome do autor da ação, a palavra "condominio" deve estar presente, independentemente de variações de maiúsculas ou minúsculas.
  - Execução Trabalhista: Aplicada quando o leilão se destina a quitar dívidas decorrentes de litígios trabalhistas.
    Critérios:
    - Verifique a presença de termos que indiquem a ocorrência de processos ou disputas no âmbito trabalhista, bem como obrigações associadas às relações de emprego.
    - Normalmente, o edital menciona varas trabalhistas, reforçando o contexto dessa execução.
  - Leilão extrajudicial (Alienação Fiduciária): Caracteriza imóveis retomados por instituições financeiras sem a necessidade de execução judicial integral, em conformidade com a Lei 9.514/1997.
    Critérios:
    - Menções isoladas à alienação/débito fiduciário não são suficientes para classificar o edital nessa categoria.
    - A ação deve ser movida por uma instituição financeira.    
  - Outras execuções: Neste grupo, enquadram-se processos de execução que não se encaixam claramente nas categorias acima, podendo incluir características mistas ou indefinidas.
`,
  });
  return debito.object;
}
