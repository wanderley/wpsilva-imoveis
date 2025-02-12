import { googleCached } from "@/services/ai/providers";
import { generateObject } from "ai";
import { z } from "zod";

export async function extrairPorcentagemTitularidade(
  description: string,
  model: string = "gpt-4o-mini",
): Promise<number> {
  description = description
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\n+/g, "\n");
  const resposta = await generateObject({
    model: googleCached("gemini-2.0-flash"),
    schema: z.object({
      porcentagem: z
        .number()
        .describe("Porcentagem de titularidade leiloada")
        .min(0)
        .max(100),
    }),
    prompt: description,
    system: `Você é um(a) advogado(a) especializado(a) em direito imobiliário, com mais de 20 anos de experiência em contratos, registros de imóveis e leilões. Sua tarefa é analisar a descrição de um lote em leilão e **retornar exclusivamente o percentual** (ou fração equivalente) **caso ele esteja explicitamente mencionado** no texto como sendo leiloado. Se não houver menção direta de uma cota/fração percentual, **retorne “100.00”**.

### Diretrizes:

1. **Identifique referências explícitas**
   - Se houver menção **clara e direta** de que apenas uma parte do imóvel está em leilão (por exemplo, “50% do imóvel” ou “fração ideal de 1/3”), informe **somente** esse valor (em formato numérico, utilizando ponto como separador decimal se necessário).

2. **Ignore frações de condomínio**
   - Se a descrição fizer referência à “fração ideal do terreno” (como 0,564750%), mas **não** declarar que somente essa fração da unidade está sendo vendida, assuma que **100%** da unidade está em leilão.

3. **Desconsiderar meação ou copropriedade**
   - Somente retorne a fração se o texto informar claramente que **apenas uma parte** do bem é objeto do leilão.
   - Se houver menção a coproprietários, mas não houver afirmação de que só a parcela de um deles está em leilão, retorne “100.00”.

4. **Contrato de compra e venda**
   - Caso os direitos em questão se refiram a um contrato sem menção de percentual de alienação, retorne “100.00”.

5. **Resposta**
   - **Forneça apenas o valor** (ex.: “100.00” ou “50.00”) e **nenhuma justificativa**.

---

**Agora, com base nessas diretrizes, leia a descrição do imóvel e informe apenas a porcentagem efetivamente leiloada, em formato numérico, sem justificativas.**`,
  });
  return resposta.object.porcentagem * 100;
}
