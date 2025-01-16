import { getProcessoJudicialTjspSettings } from "@/lib/env";
import { SystemError, stringifyError } from "@/lib/error";
import {
  carregarDocumento,
  salvarDadosPrincipais,
  salvarDocumento,
} from "@/services/processo-judicial/tjsp/repository";
import {
  DadosPrincipais,
  Documento,
  ParteInteressada,
} from "@/services/processo-judicial/tjsp/types";
import { launchBrowser, newPage } from "@/services/scraper/lib/puppeteer";
import {
  getNumberFromReais,
  parseBrazilianDate,
} from "@/services/scraper/parsers";
import { SystemFilePath } from "@/services/system-file";
import { PDFDocument } from "pdf-lib";
import { Browser, Cookie, Page } from "puppeteer";

export async function atualizarProcessoJudicialTjsp(
  numeroProcesso: string,
  linkProcesso: string,
  options: {
    downloadDocumentos: boolean;
  },
) {
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser([]);
    await efetuarLoginPaginaTribunal(browser);
    const { dadosPrincipais, documentos } = await extrairDados(
      browser,
      numeroProcesso,
      linkProcesso,
    );
    await salvarDadosPrincipais(numeroProcesso, dadosPrincipais);
    await salvarDocumentos(browser, documentos, options.downloadDocumentos);
  } catch (error) {
    console.error(
      "Erro ao atualizar processo judicial\n",
      stringifyError(error),
    );
  } finally {
    await browser?.close();
  }
}

async function salvarDocumentos(
  browser: Browser,
  documentos: Documento[],
  shouldDownloadDocumentos: boolean,
) {
  const chunkSize = 2;
  for (let i = 0; i < documentos.length; i += chunkSize) {
    await Promise.all(
      documentos.slice(i, i + chunkSize).map(async (documento) => {
        await baixarSalvarDocumento(
          browser,
          documento,
          shouldDownloadDocumentos,
        );
      }),
    );
  }
}

async function baixarSalvarDocumento(
  browser: Browser,
  documento: Documento,
  shouldDownloadDocumentos: boolean,
) {
  try {
    if (shouldDownloadDocumentos && !(await documento.file.exists())) {
      await baixarDocumentoDaPastaDigital(documento);
    }
    const documentoSalvo = await carregarDocumento(documento);
    if (documentoSalvo) {
      return;
    }
    const partesProcessoOrigem = await listarPartesDoProcesso(
      browser,
      documento,
    );
    await salvarDocumento({
      ...documento,
      partesProcessoOrigem,
    });
  } catch (error) {
    console.error(
      `[process-judicial] Erro ao salvar documento ${documento.file.path()}`,
      stringifyError(error),
    );
  }
}

async function listarPartesDoProcesso(
  browser: Browser,
  documento: Documento,
): Promise<ParteInteressada[]> {
  let page: Page | undefined;
  try {
    page = await newPage(browser);
    if (!documento.codigoProcessoOrigem) {
      return [];
    }
    await page.goto(
      `https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo=${documento.codigoProcessoOrigem}`,
    );
    return await getPartesInteressadas(page);
  } catch (error) {
    throw new SystemError("Erro ao listar partes do processo", error);
  } finally {
    await page?.close();
  }
}

async function extrairDados(
  browser: Browser,
  numeroProcesso: string,
  linkProcesso: string,
) {
  const dadosPrincipais = await extrairDadosPrincipais(
    browser,
    numeroProcesso,
    linkProcesso,
  );
  const documentos = await listarDocumentos(
    browser,
    numeroProcesso,
    linkProcesso,
  );
  return {
    dadosPrincipais,
    documentos,
  };
}

async function extrairDadosPrincipais(
  browser: Browser,
  numeroProcesso: string,
  linkProcesso: string,
): Promise<DadosPrincipais> {
  let page: Page | undefined;
  async function getContent(selector: string) {
    try {
      return await page!.evaluate(
        (selector) => document.querySelector(selector)?.textContent?.trim(),
        selector,
      );
    } catch (error) {
      throw new SystemError("Erro ao extrair conteúdo da página", error, {
        selector,
      });
    }
  }
  async function getDate(selector: string) {
    try {
      return parseBrazilianDate(
        (await getContent(selector))?.replace(
          /.*(\d\d\/\d\d\/\d\d\d\d) às (\d\d:\d\d).*/,
          "$1 $2",
        ),
        "dd/MM/yyyy HH:mm",
      );
    } catch (error) {
      throw new SystemError("Erro ao extrair data", error, {
        selector,
      });
    }
  }
  async function getApensos(): Promise<DadosPrincipais["apensos"]> {
    try {
      return await page!.evaluate(() => {
        return Array.from(document.querySelectorAll("#dadosApenso tr")).map(
          (tr) => {
            return {
              numeroProcesso: tr
                .querySelector("a.processoApensado")
                ?.textContent?.trim(),
              classe: tr.querySelector("td:nth-child(2)")?.textContent?.trim(),
              apensamento: tr
                .querySelector("td:nth-child(3)")
                ?.textContent?.trim(),
              motivo: tr.querySelector("td:nth-child(4)")?.textContent?.trim(),
            };
          },
        );
      });
    } catch (error) {
      throw new SystemError("Erro ao extrair apensos", error);
    }
  }
  try {
    page = await newPage(browser);
    await page.goto(linkProcesso);
    return {
      classe: await getContent("#classeProcesso"),
      assunto: await getContent("#assuntoProcesso"),
      foro: await getContent("#foroProcesso"),
      vara: await getContent("#varaProcesso"),
      juiz: await getContent("#juizProcesso"),
      distribuicao: await getDate("#dataHoraDistribuicaoProcesso"),
      numeroControle: await getContent("#numeroControleProcesso"),
      area: await getContent("#areaProcesso"),
      valorAcao: getNumberFromReais(await getContent("#valorAcaoProcesso")),
      situacao: await getContent("#labelSituacaoProcesso"),
      processoPrincipal: await getContent(".processoPrinc"),
      partes: await getPartesInteressadas(page),
      apensos: await getApensos(),
    };
  } catch (error) {
    throw new SystemError(
      "Erro ao extrair dados principais do processo judicial",
      error,
    );
  } finally {
    await page?.close();
  }
}

async function getPartesInteressadas(page: Page): Promise<ParteInteressada[]> {
  try {
    return await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("#tablePartesPrincipais tr"),
      ).map((tr) => {
        const tds = Array.from(tr.querySelectorAll("td")).map((td) =>
          (td.textContent || "Não encontrado")
            .replace(/\s+/g, " ")
            .replace(/(\w+: )/g, "\n$1")
            .trim(),
        );
        return {
          tipo: tds[0],
          nomes: tds[1].split("\n").map((parte) => parte.trim()),
        };
      });
    });
  } catch (error) {
    throw new SystemError("Erro ao extrair partes", error);
  }
}

async function listarDocumentos(
  browser: Browser,
  numeroProcesso: string,
  linkProcesso: string,
): Promise<Documento[]> {
  let page: Page | undefined;
  try {
    page = await newPage(browser);
    const linkPastaDigital = await gerarLinkPastaDigital(browser, linkProcesso);
    await page.goto(linkPastaDigital);
    const cookies = await page.cookies();
    return (await extrairDocumentosPastaDigital(page)).map((documento) => ({
      ...documento,
      numeroProcesso,
      cookies,
      file: SystemFilePath.paginasDoProcessoJudicialPDF(
        numeroProcesso,
        documento.primeiraPagina,
        documento.ultimaPagina,
      ),
    }));
  } catch (error) {
    throw new Error(
      `[processo-judicial][${numeroProcesso}] Erro ao listar documentos`,
      { cause: error },
    );
  } finally {
    await page?.close();
  }
}

async function mergePdfs(pdfBuffers: ArrayBuffer[]) {
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

type DocumentoExtraido = Omit<Documento, "numeroProcesso" | "file" | "cookies">;
type DocumentoExtraidoRaw = Omit<DocumentoExtraido, "dataInclusao"> & {
  dataInclusao: string;
};
async function extrairDocumentosPastaDigital(
  page: Page,
): Promise<DocumentoExtraido[]> {
  const documentos: DocumentoExtraidoRaw[] = await page.evaluate(() => {
    // @ts-expect-error requestScope is an object available in the page
    return requestScope.map((item): DocumentoExtraidoRaw => {
      const subdocumentos = item.children.map(
        // @ts-expect-error requestScope is an object available in the page
        (child) => {
          return {
            primeiraPagina: child.data.indicePagina,
            ultimaPagina: child.data.indicePagina + child.data.nuPaginas - 1,
            href: child.data.parametros,
          };
        },
      );
      return {
        codigoDocumento: item.data.cdDocumento,
        dataInclusao: item.data.dtInclusao,
        titulo: item.data.title,
        primeiraPagina: subdocumentos[0].primeiraPagina,
        ultimaPagina: subdocumentos[subdocumentos.length - 1].ultimaPagina,
        tipoDocumentoDigital: item.data.cdTipoDocDigital,
        folhaPeticaoInicial: item.data.flPeticaoInicial,
        codigoProcessoOrigem: item.data.cdProcessoOrigem,
        subdocumentos,
      };
    });
  });
  return documentos.map((documento) => ({
    codigoDocumento: documento.codigoDocumento,
    dataInclusao: parseBrazilianDate(
      documento.dataInclusao,
      "dd/MM/yyyy HH:mm:ss",
    )!,
    titulo: documento.titulo,
    primeiraPagina: documento.primeiraPagina,
    ultimaPagina: documento.ultimaPagina,
    tipoDocumentoDigital: documento.tipoDocumentoDigital,
    folhaPeticaoInicial: documento.folhaPeticaoInicial,
    codigoProcessoOrigem: documento.codigoProcessoOrigem,
    subdocumentos: documento.subdocumentos,
  }));
}

async function efetuarLoginPaginaTribunal(browser: Browser) {
  try {
    const page = await newPage(browser);
    await page.goto("https://esaj.tjsp.jus.br/sajcas/login");
    const { login, password } = getProcessoJudicialTjspSettings();
    await page.type("#usernameForm", login);
    await page.type("#passwordForm", password);
    await Promise.all([page.click("#pbEntrar"), page.waitForNavigation()]);
  } catch (error) {
    throw new Error("Erro ao efetuar login na página do tribunal", {
      cause: error,
    });
  }
}

async function gerarLinkPastaDigital(
  browser: Browser,
  linkProcesso: string,
): Promise<string> {
  let page: Page | undefined;
  try {
    page = await newPage(browser);
    await page.goto(linkProcesso);
    const redirectLink = await page.evaluate(() => {
      const linkElement = document.querySelector(
        "#linkPasta",
      ) as HTMLAnchorElement;
      return linkElement?.href;
    });
    if (redirectLink == null) {
      throw new Error(
        "Link de redirecionamento para pasta digital não encontrado",
      );
    }

    // weird but the contents of the page at redirectLink has the link to the Pasta Digital
    await page.goto(redirectLink);
    const link = await page.evaluate(
      () => document.querySelector("body")?.textContent,
    );
    if (link == null) {
      throw new Error("Link para pasta digital não encontrado");
    }
    return link;
  } catch (error) {
    throw new Error("Erro ao gerar link para pasta digital", {
      cause: error,
    });
  } finally {
    await page?.close();
  }
}

async function baixarDocumentoDaPastaDigital(documento: Documento) {
  if (documento.subdocumentos.length === 0) {
    throw new Error("Documento não possui partes");
  }
  try {
    console.info(
      `[process-judicial] Baixando documento: ${documento.file.path()}`,
    );
    if (await documento.file.exists()) {
      return;
    }
    const pdfBuffers: ArrayBuffer[] = await Promise.all(
      documento.subdocumentos.map(
        async (subdocumento) =>
          await baixarArquivoPDF(subdocumento.href, documento.cookies),
      ),
    );
    const mergedPdfBuffer = await mergePdfs(pdfBuffers);
    await documento.file.write(mergedPdfBuffer);
  } catch (error) {
    throw new Error("Erro ao baixar documento do processo judicial", {
      cause: error,
    });
  }
}

async function baixarArquivoPDF(
  href: string,
  cookies: Cookie[],
  maxAttempts: number = 3,
) {
  let response: Response;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      response = await fetch(
        `https://esaj.tjsp.jus.br/pastadigital/getPDF.do?${href}`,
        {
          headers: {
            Cookie: cookies
              .map((cookie) => `${cookie.name}=${cookie.value}`)
              .join("; "),
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      break;
    } catch (error) {
      attempts++;
      console.info(
        `Tentativa ${attempts} de download do arquivo ${href} falhou: ${(error as Error).message}`,
      );
      if (attempts === maxAttempts) {
        throw new Error(
          `Falha ao baixar arquivo ${href} após ${maxAttempts} tentativas`,
        );
      }
    }
  }
  return await response!.arrayBuffer();
}
