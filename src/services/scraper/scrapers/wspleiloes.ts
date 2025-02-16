import { Scraper } from "@/services/scraper/scraper";
import {
  IncludesFinder,
  ReturnText,
  ReturnTextNextSibling,
  getBrazilianDate,
  getFromSelector,
  getNumberFromReais,
  getTextFromSelector,
  matchText,
  or,
  pipe,
} from "@/services/scraper/scrapers/lib/extractors";
import { regularFetch } from "@/services/scraper/scrapers/lib/fetch";

export const Wspleiloes: Scraper = {
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
        address_cidade_ibge: "",
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
  fetch: regularFetch,
  status: pipe(getTextFromSelector("#status_lote .label_lote"), (status) => {
    switch (status) {
      case "Aguarde Abertura":
        return "waiting-to-start";
      case "Aberto para Lances":
        return "open-for-bids";
      case "Vendido":
        return "sold";
      case "Sem Licitante":
      case "Fechado para Lances":
        return "closed";
      case "Cancelado":
        return "suspended";
      default:
        console.error(`[www.wspleiloes.com.br] Unknown status: ${status}`);
        return "unknown";
    }
  }),
  name: async (page) =>
    await page.evaluate(() =>
      document
        .querySelector(
          "div.detalhes-lote > div.px-1.text-center > h1:nth-child(2)",
        )
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
      Array.from(document.querySelectorAll("b"))
        .find((div) => div.textContent?.includes("Descrição:"))
        ?.parentElement?.textContent?.trim()
        .replace("Descrição:", "")
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
  bid: async (page) =>
    getNumberFromReais(
      (await page.evaluate(
        () => document.querySelector("#lance_inicial")?.textContent,
      )) ||
        (await page.evaluate(
          () =>
            document.querySelector(".maior-lance > #valor_lance")?.textContent,
        )),
    ),
  appraisal: async (page) =>
    getNumberFromReais(
      await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("h6"))
            .find((elem) => elem.textContent?.includes("Valor de Avaliação:"))
            ?.textContent?.match(/R\$([\d.,]+)/)?.[1],
      ),
    ),
  firstAuctionDate: or(
    getAuctionDate("Data 1º Leilão:"),
    getAuctionDate("Data do Leilão:"),
  ),
  firstAuctionBid: or(
    getAuctionBid("Data 1º Leilão:"),
    getAuctionBid("Data do Leilão:"),
  ),
  secondAuctionDate: getAuctionDate("Data 2º Leilão:"),
  secondAuctionBid: getAuctionBid("Data 2º Leilão:"),
  images: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll(".carousel-item > a"))
        .map((a) => a.getAttribute("href"))
        .filter((href): href is string => href !== null),
    )) || [],
  laudoLink: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => {
          const text = elem.textContent?.toLowerCase();
          return text?.includes("laudo") || text?.includes("auto de avaliação");
        })
        ?.getAttribute("href"),
    )) ?? undefined,
  matriculaLink: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => {
          const text = elem.textContent?.toLowerCase();
          return text?.includes("matrícula") || text?.includes("matricula");
        })
        ?.getAttribute("href"),
    )) ?? undefined,
  editalLink: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.toLowerCase().includes("edital"))
        ?.getAttribute("href"),
    )) ?? undefined,
};

function getAuctionDate(text: string) {
  return pipe(
    getFromSelector("h6", IncludesFinder(text), ReturnText()),
    matchText(
      /(\d{2}\/\d{2}\/\d{4}) (\d{2}):(\d{2})/,
      (_, day, hour, minute) => `${day} ${hour}:${minute}`,
    ),
    getBrazilianDate("dd/MM/yyyy HH:mm"),
  );
}

function getAuctionBid(text: string) {
  return pipe(
    getFromSelector("h6", IncludesFinder(text), ReturnTextNextSibling()),
    matchText(/R\$([\d.,]+)/, (_, value) => value),
    getNumberFromReais,
  );
}
