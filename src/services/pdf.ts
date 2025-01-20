import assertNever from "@/lib/assert-never";
import { LocalDir } from "@/services/file/local-file";
import { IFile } from "@/services/file/types";
import { exec } from "child_process";
import { PDFDocument } from "pdf-lib";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function mergePdfs(pdfBuffers: ArrayBuffer[]) {
  const mergedPdf = await PDFDocument.create();
  const pdfs = await Promise.all(
    pdfBuffers.map((pdfBuffer) => PDFDocument.load(pdfBuffer)),
  );
  for (const pdf of pdfs) {
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }
  return await mergedPdf.save();
}

export async function convertPdfToImages(
  pdfFile: IFile,
  format: "webp" | "jpg" = "webp",
): Promise<IFile[]> {
  const localDir = new LocalDir(pdfFile.path());
  await localDir.create();
  await pdfFile.download();
  switch (format) {
    case "webp":
      await execPromise(
        `magick -density 300 ${pdfFile.localPath()} -quality 100 -background white -alpha remove -alpha off ${localDir.localPath()}/image-%04d.webp`,
      );
      break;
    case "jpg":
      await execPromise(
        `magick -density 300 ${pdfFile.localPath()} -quality 100 ${localDir.localPath()}/image-%04d.jpg`,
      );
      break;
    default:
      assertNever(format);
  }
  return await localDir.listFiles();
}
