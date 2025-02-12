import {
  PromptContext,
  promptContextString,
} from "@/services/ai/prompt-context";
import { googleCached } from "@/services/ai/providers";
import { generateText } from "ai";

const PERSONA = `Você é um advogado especializado em leilões judiciais, com mais de 20 anos de experiência na análise de editais e matrículas de imóveis.`;

export async function extrairListaDebitosOnus(contextoEdital: PromptContext) {
  const listaDebitosOnus = await generateText({
    model: googleCached("gemini-2.0-flash"),
    temperature: 0,
    system: `${PERSONA}
    Sua tarefa é ler o conteúdo do edital fornecido e extrair todos os débitos e ônus relacionados ao imóvel. Siga as instruções abaixo:
    
    1. **Identificação dos Credores:**
       - Leia o edital e **liste todos os credores distintos** que aparecem no documento.
    
    2. **Extração e Consolidação dos Débitos/Ônus por Credor:**
       - Para cada credor listado, identifique e extraia os débitos/ônus associados.
       - **Atenção:** Cada credor tem apenas um débito/ônus que está sendo cobrado. Se encontrar mais de um débito para o mesmo credor, consolide-os em um único item, combinando as informações pertinentes.
       - Para cada débito/ônus identificado (após a consolidação), organize as seguintes informações, sempre que disponíveis:
         - **Tipo de débito/ônus:** (ex.: IPTU, condomínio, financiamento, penhora, etc.)
         - **Valor:** (quando informado)
         - **Data de vencimento:** (quando aplicável)
         - **Credor:** (confirme o nome do credor)
         - **Referências ao registro de matrícula:** (quando disponível)
         - **Descrição ou condições adicionais:** Inclua qualquer informação extra relevante, especialmente aquelas que ajudem a identificar quem será o responsável pelo débito/ônus em caso de arrematação.
       - Indique, se necessário, quais informações estão faltando para algum débito/ônus.
    
    3. **Formato da Resposta:**
       - Apresente sua resposta utilizando **listas** (não use tabelas), organizada em duas seções:
         - **Seção 1:** Lista de todos os credores encontrados.
         - **Seção 2:** Para cada credor, uma lista dos débitos/ônus consolidados relacionados.
       - Caso o edital não contenha nenhum débito/ônus, responda com: “Nenhum débito/ônus encontrado”.
    `,
    prompt: `${promptContextString("Dados", [contextoEdital])}`,
  });
  // console.log(listaDebitosOnus.text);
  return listaDebitosOnus.text;
}
