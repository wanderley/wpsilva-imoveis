import { realToNumber } from "@/services/scraper/parsers";
import { Scraper } from "@/services/scraper/scraper";

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
    realToNumber(
      (await page.evaluate(
        () => document.querySelector("#lance_inicial")?.textContent,
      )) ||
        (await page.evaluate(
          () =>
            document.querySelector(".maior-lance > #valor_lance")?.textContent,
        )),
    ),
  appraisal: async (page) =>
    realToNumber(
      await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("h6"))
            .find((elem) => elem.textContent?.includes("Valor de Avaliação:"))
            ?.textContent?.match(/R\$([\d.,]+)/)?.[1],
      ),
    ),
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
  laudo_link: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("LAUDO"))
        ?.getAttribute("href"),
    )) ?? undefined,
  matricula_link: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("MATRÍCULA"))
        ?.getAttribute("href"),
    )) ?? undefined,
  edital_link: async (page) =>
    (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a"))
        .find((elem) => elem.textContent?.includes("EDITAL"))
        ?.getAttribute("href"),
    )) ?? undefined,
};