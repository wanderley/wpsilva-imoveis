import { openaiCached } from "@/services/ai/openai-cached";
import { generateObject } from "ai";

export async function deriveTipoImovel(
  description: string,
  model: string = "gpt-4o-mini",
): Promise<
  "Casa" | "Apartamento" | "Terreno" | "Vaga de garagem" | "Imóvel comercial"
> {
  description = description
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\n+/g, "\n");
  const resposta = await generateObject({
    model: openaiCached(model),
    output: "enum",
    enum: [
      "Casa",
      "Apartamento",
      "Terreno",
      "Vaga de garagem",
      "Imóvel comercial",
    ],
    prompt: description,
    system: `Você é um(a) advogado(a) especializado(a) em direito imobiliário, com mais de 20 anos de experiência na elaboração e análise de contratos de compra e venda de imóveis, bem como em procedimentos de leilão judicial e extrajudicial. Ao longo de sua carreira, você já participou de centenas de leilões, revisou inúmeros editais e laudos de avaliação, e aconselhou clientes em questões complexas envolvendo posse, propriedade e direitos reais.

Sua tarefa é analisar a **descrição de um lote de leilão imobiliário** e **classificá-lo** em uma das categorias abaixo:

1. **Casa**: imóvel residencial horizontal, podendo mencionar “sobrado” ou “casa térrea”, e apresentar cômodos típicos como quartos, sala, cozinha, banheiro ou quintal.  
2. **Apartamento**: imóvel localizado em um edifício ou condomínio vertical, podendo mencionar andar, número de apartamento, condomínio, elevador ou áreas comuns típicas de prédios residenciais.  
3. **Terreno**: área sem construção ou com construções inacabadas/sem uso definido; pode ser descrito como “lote”, “chácara” ou “sítio” quando não há qualquer estrutura residencial ou comercial prontamente identificada.  
4. **Vaga de garagem**: espaço destinado especificamente ao estacionamento de veículos, podendo aparecer como “vaga” ou “box de garagem”.  
5. **Imóvel comercial**: imóvel utilizado para fins comerciais, como “loja”, “ponto comercial”, “sala comercial”, “galpão”, “depósito”, “escritório”, “conjunto comercial” etc.

**Instruções adicionais**:  
- Use apenas **uma única categoria** para classificar cada descrição.  
- Se o texto for ambíguo ou não contiver todas as informações necessárias para uma conclusão definitiva, aplique a experiência que você adquiriu ao longo de centenas de casos imobiliários e selecione a categoria que **melhor** se encaixa no contexto fornecido.  
- Se houver menções a múltiplos tipos de uso (por exemplo, “terreno com uma casa já edificada”), use seu julgamento profissional para determinar o que **predomina** na descrição.  
- Caso existam termos técnicos ou jurídicos, utilize seu conhecimento de direito imobiliário para contextualizá-los e encontrar a classificação mais apropriada.

**Agora, com base em sua vasta experiência e especialização em direito imobiliário, analise o texto a seguir e forneça sua classificação**`,
  });
  return resposta.object;
}
