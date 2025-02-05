import { SystemFile } from "@/services/file/system-file";
import { extractTextWithAi } from "@/services/pdf/extract-text-with-ai";
import { extractTextFromPdfWithTika } from "@/services/pdf/tika";

export async function gerarContextoEdital(editalFilePath: string) {
  const editalFile = new SystemFile(editalFilePath);
  await editalFile.download();
  return {
    type: "documento",
    props: [{ name: "nome", value: "edital" }],
    content: (await extractTextFromPdfWithTika(editalFile)).trim(),
  };
}

export async function gerarContextoMatricula(matriculaFilePath: string) {
  const matriculaFile = new SystemFile(matriculaFilePath);
  await matriculaFile.download();
  return {
    type: "documento",
    props: [{ name: "nome", value: "matricula" }],
    content: (await extractTextWithAi(matriculaFile, "gpt-4o-mini"))
      .map((page) => page.texto.trim())
      .join("\n"),
  };
}
