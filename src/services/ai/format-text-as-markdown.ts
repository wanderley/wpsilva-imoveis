import { openaiCached } from "@/services/ai/providers";
import { generateText } from "ai";

export async function formatTextAsMarkdown(text: string): Promise<string> {
  const result = await generateText({
    model: openaiCached("gpt-4o-mini"),
    system: `Formatar o texto fornecido em Markdown sem alterar seu conteúdo.
        
  - Apenas formate o texto recebido e devolva-o em Markdown.
  - Não inclua tags de código ou qualquer outra formatação desnecessária.
  
  # Output Format
  
  O texto formatado deve ser retornado como um único bloco de texto em Markdown, sem incluir tags de código como "\`\`\`markdown".
  
  # Notes
  
  Certifique-se de respeitar a estrutura original do texto, fornecendo formatação de títulos, listas, negrito, itálico e outros elementos do Markdown conforme necessário, sem modificar o conteúdo textual.`,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  });
  return result.text;
}
