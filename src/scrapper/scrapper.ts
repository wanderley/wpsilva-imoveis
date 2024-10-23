"use server";

import { db } from "@/db";
import { scrapFilesTable, scrapsTable } from "@/db/schema";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { and, eq } from "drizzle-orm";
import puppeteer from "puppeteer";
import { Page } from "puppeteer";

enum DocumentType {
  EDITAL = "edital",
  LAUDO = "laudo",
  MATRICULA = "matricula",
}

type Document = {
  type: DocumentType;
  link: string;
};

type Lot = {
  name: string;
  address: string;
  description: string;
  caseNumber?: string | null;
  caseLink?: string | null;
  bid?: number | null;
  minimumIncrement?: number | null;
  firstAuctionDate?: string | null;
  firstAuctionBid?: number | null;
  secondAuctionDate?: string | null;
  secondAuctionBid?: number | null;
  images: Array<string>;
  documents: Array<Document>;
};

type ScraperType = {
  url: string;
  search: (page: Page) => Promise<Array<string>>;
  name: (page: Page) => Promise<string | undefined>;
  address: (page: Page) => Promise<string>;
  description: (page: Page) => Promise<string | undefined>;
  caseNumber: (page: Page) => Promise<string | undefined>;
  caseLink: (page: Page) => Promise<string | undefined>;
  bid: (page: Page) => Promise<number | undefined>;
  minimumIncrement: (page: Page) => Promise<number | undefined>;
  firstAuctionDate: (page: Page) => Promise<string | undefined>;
  firstAuctionBid: (page: Page) => Promise<number | undefined>;
  secondAuctionDate: (page: Page) => Promise<string | undefined>;
  secondAuctionBid: (page: Page) => Promise<number | undefined>;
  images: (page: Page) => Promise<Array<string>>;
  documents: (page: Page) => Promise<Array<Document>>;
};

async function notFound<T>(_page: Page): Promise<T | undefined> {
  return undefined;
}

const Wspleiloes: ScraperType = {
  url: "www.wspleiloes.com.br",
  search: async (page) => {
    function getSearchURL(pageNumber: number): string {
      const searchParams = new URLSearchParams({
        tipo: "imovel",
        categoria_id: "",
        data_leilao_ini: "",
        data_leilao_fim: "",
        lance_inicial_ini: "",
        lance_inicial_fim: "",
        address_uf: "SP",
        address_cidade_ibge: "3550308", // Cidade: Sao Paulo
        address_logradouro: "",
        comitente_id: "",
        search: "",
        page: pageNumber.toString(),
      });
      return (
        "https://www.wspleiloes.com.br/lotes/imovel?" + searchParams.toString()
      );
    }

    let pageNumber = 1;
    const links = [];
    while (pageNumber < 10) {
      await page.goto(getSearchURL(pageNumber++));
      const isLastPage = await page.evaluate(() =>
        document.body.innerText.includes("NENHUM LOTE ENCONTRADO NO MOMENTO"),
      );
      if (isLastPage) {
        break;
      }
      links.push(
        ...(await page.evaluate(() =>
          Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) =>
              /https:\/\/www\.wspleiloes\.com\.br\/item\/\d+\/detalhes\?page=\d+/.test(
                href,
              ),
            )
            .map((a) => a.replace("?page=1", "")),
        )),
      );
    }
    return links;
  },
  name: async (page) =>
    await page.evaluate(() =>
      document
        .querySelector(".detalhes-lote > div > h4:nth-child(2)")
        ?.textContent?.trim(),
    ),
  address: async (page) =>
    (await page.evaluate(() =>
      document
        .evaluate(
          "//h5[contains(text(), 'Localização do Imóvel')]/following-sibling::div",
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        )
        ?.singleNodeValue?.textContent?.replace(/\s+/g, " ")
        .replace("Endereço:", "")
        .trim()
        .replace(/( Cidade: | - CEP: )/g, " - "),
    )) || "",
  description: async (page) =>
    await page.evaluate(() =>
      document
        .querySelector(".detalhes-lote")
        ?.textContent?.trim()
        .replace(/[ ]+/g, " ")
        .replace(/\s*\n+/g, "\n")
        .replace(/\n /g, "\n"),
    ),
  caseNumber: async (page) =>
    await page.evaluate(
      () =>
        document
          .querySelector(".detalhes-lote")
          ?.textContent?.match(
            /Processo:\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/,
          )![1],
    ),
  caseLink: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("a"))
          .find((a) => a.getAttribute("download")?.includes("Processo.pdf"))
          ?.getAttribute("href") || undefined,
    ),
  bid: notFound,
  minimumIncrement: notFound,
  firstAuctionDate: async (page) =>
    await page.evaluate(() =>
      Array.from(document.querySelectorAll("h6"))
        .find((elem) => elem.textContent?.includes("Data 1º Leilão:"))
        ?.textContent?.replace("Data 1º Leilão: ", ""),
    ),
  firstAuctionBid: async (page) =>
    realToNumber(
      await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("h6"))
            .find((elem) => elem.textContent?.includes("Data 1º Leilão:"))
            ?.nextElementSibling?.textContent?.match(/R\$([\d.,]+)/)?.[1],
      ),
    ),
  secondAuctionDate: async (page) =>
    await page.evaluate(() =>
      Array.from(document.querySelectorAll("h6"))
        .find((elem) => elem.textContent?.includes("Data 2º Leilão:"))
        ?.textContent?.replace("Data 2º Leilão: ", ""),
    ),
  secondAuctionBid: async (page) =>
    realToNumber(
      await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("h6"))
            .find((elem) => elem.textContent?.includes("Data 2º Leilão:"))
            ?.nextElementSibling?.textContent?.match(/R\$([\d.,]+)/)?.[1],
      ),
    ),
  images: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll(".carousel-item > a"))
        .map((a) => a.getAttribute("href"))
        .filter((href): href is string => href !== null),
    )) || [],
  documents: async (page) => {
    const documents = [];
    const laudo = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("LAUDO"))
        ?.getAttribute("href"),
    );
    if (laudo != null) {
      documents.push({ type: DocumentType.LAUDO, link: laudo });
    }
    const matricula = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("MATRICULA"))
        ?.getAttribute("href"),
    );
    if (matricula != null) {
      documents.push({ type: DocumentType.MATRICULA, link: matricula });
    }
    const edital = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("EDITAL"))
        ?.getAttribute("href"),
    );
    if (edital != null) {
      documents.push({ type: DocumentType.EDITAL, link: edital });
    }
    return documents;
  },
};

function realToNumber(real: string | null | undefined): number | undefined {
  if (real == null) {
    return undefined;
  }
  return Number(
    real
      .replace("R$", "")
      .replace(/\s+/g, "")
      .replace(".", "")
      .replace(",", "."),
  );
}

const parseBrazilianDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const parsedDate = parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  return fromZonedTime(parsedDate, "America/Sao_Paulo");
};

export async function refreshScraps(scrapID: string): Promise<void> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  const urls = [...new Set(await Wspleiloes.search(page))];

  for (const url of urls) {
    const existingScrap = await db
      .select()
      .from(scrapsTable)
      .where(
        and(eq(scrapsTable.scrapper_id, scrapID), eq(scrapsTable.url, url)),
      )
      .execute();

    if (existingScrap.length === 0) {
      await db
        .insert(scrapsTable)
        .values({
          scrapper_id: scrapID,
          url,
          fetch_status: "not-fetched",
        })
        .execute();
    }
  }

  await browser.close();
}

async function scrapLink(page: Page): Promise<Lot | null> {
  // TODO: Log fields that couldn't be fetched
  async function tryFetchField<T>(
    field: (page: Page) => Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await field(page);
    } catch (_) {
      return undefined;
    }
  }
  const name = await tryFetchField(Wspleiloes.name);
  if (name == undefined) {
    return null;
  }
  const address = await tryFetchField(Wspleiloes.address);
  if (address == undefined) {
    return null;
  }
  const lot = {
    name,
    address,
    description:
      (await tryFetchField(Wspleiloes.description)) ||
      "Descrição não encontrada",
    caseNumber: await tryFetchField(Wspleiloes.caseNumber),
    caseLink: await tryFetchField(Wspleiloes.caseLink),
    bid: await tryFetchField(Wspleiloes.bid),
    minimumIncrement: await tryFetchField(Wspleiloes.minimumIncrement),
    firstAuctionDate: await tryFetchField(Wspleiloes.firstAuctionDate),
    firstAuctionBid: await tryFetchField(Wspleiloes.firstAuctionBid),
    secondAuctionDate: await tryFetchField(Wspleiloes.secondAuctionDate),
    secondAuctionBid: await tryFetchField(Wspleiloes.secondAuctionBid),
    images: (await tryFetchField(Wspleiloes.images)) || [],
    documents: (await tryFetchField(Wspleiloes.documents)) || [],
  };
  return lot;
}

export async function updateScrap(
  scrapperID: string,
  url: string,
): Promise<void> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    await page.goto(url);
    let scrapData;
    try {
      scrapData = await scrapLink(page);
    } catch (_) {
      scrapData = null;
    }
    if (!scrapData) {
      await db
        .update(scrapsTable)
        .set({
          fetch_status: "failed",
        })
        .where(
          and(
            eq(scrapsTable.scrapper_id, scrapperID),
            eq(scrapsTable.url, url),
          ),
        )
        .execute();
    } else if (scrapData) {
      await db
        .update(scrapsTable)
        .set({
          fetch_status: "fetched",
          address: scrapData.address,
          description: scrapData.description,
          case_number: scrapData.caseNumber,
          case_link: scrapData.caseLink,
          bid: scrapData.secondAuctionBid || scrapData.firstAuctionBid,
          minimum_increment: null, // Not provided in the current scraper
          first_auction_date: parseBrazilianDate(scrapData.firstAuctionDate),
          first_auction_bid: scrapData.firstAuctionBid,
          second_auction_date: parseBrazilianDate(scrapData.secondAuctionDate),
          second_auction_bid: scrapData.secondAuctionBid,
        })
        .where(
          and(
            eq(scrapsTable.scrapper_id, scrapperID),
            eq(scrapsTable.url, url),
          ),
        )
        .execute();

      // Get the scrap ID
      const scrapResult = await db
        .select({ id: scrapsTable.id })
        .from(scrapsTable)
        .where(
          and(
            eq(scrapsTable.scrapper_id, scrapperID),
            eq(scrapsTable.url, url),
          ),
        )
        .limit(1)
        .execute();

      if (scrapResult.length > 0) {
        const scrapId = scrapResult[0].id;

        // Remove all existing files for this scrap
        await db
          .delete(scrapFilesTable)
          .where(eq(scrapFilesTable.scrap_id, scrapId))
          .execute();

        // Insert new images
        for (const imageUrl of scrapData.images) {
          await db
            .insert(scrapFilesTable)
            .values({
              scrap_id: scrapId,
              file_type: "jpg",
              document_type: "imagem_lote",
              url: imageUrl,
            })
            .execute();
        }

        // Insert new documents
        for (const doc of scrapData.documents) {
          await db
            .insert(scrapFilesTable)
            .values({
              scrap_id: scrapId,
              file_type: "pdf",
              document_type: doc.type,
              url: doc.link,
            })
            .execute();
        }
      }
    }
  } catch (error) {
    console.error("Error updating scrap:", error);
    await db
      .update(scrapsTable)
      .set({
        fetch_status: "failed",
      })
      .where(
        and(eq(scrapsTable.scrapper_id, scrapperID), eq(scrapsTable.url, url)),
      )
      .execute();
    throw error;
  } finally {
    await browser.close();
  }
}
