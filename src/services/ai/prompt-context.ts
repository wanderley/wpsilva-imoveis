/**
 * A context data to be used in the prompt.
 */
export type PromptContext = {
  type: string;
  props: { name: string; value: string }[];
  content: string;
};

/**
 * Creates a string of context data to be used in the prompt.
 * The output is a string with a section and XML tags for each context item.
 *
 * @param sectionTitle The title of the section.
 * @param data The array of PromptContext.
 * @returns The context string.
 *
 * @example
 * ```typescript
 * promptContextString("Contexto", [
 *    { type: "documento", props: [{ name: "nome", value: "edital" }], content: "..." },
 *    { type: "documento", props: [{ name: "nome", value: "matricula" }], content: "..." },
 * ])
 * ```
 * will generate
 * ```markdown
 * ### Contexto
 * <documento nome="edital">
 * ...
 * </documento>
 *
 * <documento nome="matricula">
 * ...
 * </documento>
 *
 * ---
 * ```
 */
export function promptContextString(
  sectionTitle: string,
  data: PromptContext[],
) {
  if (data.length === 0) {
    return "";
  }
  const dataString = data
    .map((d) => {
      let props = "";
      if (d.props.length > 0) {
        props = ` ${d.props.map((p) => `${p.name}="${p.value}"`).join(" ")}`;
      }
      return `<${d.type}${props}>\n${d.content}\n</${d.type}>`;
    })
    .join("\n\n");
  return `### ${sectionTitle}\n${dataString}\n\n---\n\n`;
}
