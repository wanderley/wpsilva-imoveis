import { TempFile } from "@/services/file/temp-file";
import { IFile } from "@/services/file/types";
import { exec } from "child_process";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { promisify } from "util";

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

export async function convertPdfToImages(pdfFile: IFile): Promise<IFile[]> {
  const pdfContent = await pdfFile.read();
  const pdfDoc = await PDFDocument.load(pdfContent);
  const pages = pdfDoc.getPages();

  async function extractPage(index: number): Promise<IFile> {
    const tempFile = new TempFile(
      path.join(pdfFile.path(), `${index + 1}.jpg`),
    );
    if (await tempFile.exists()) {
      return tempFile;
    }
    await tempFile.touch();
    const command = `magick -density 300 ${pdfFile.fullPath()}[${index}] -quality 100 ${tempFile.fullPath()}`;
    await promisify(exec)(command);
    return tempFile;
  }

  return await Promise.all(pages.map((_, index) => extractPage(index)));
}
