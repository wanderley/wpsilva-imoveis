import { Scraper, scrollToBottom } from "@/services/scraper/scraper";

import { parseBrazilianDate, realToNumber } from "../parsers";

export const Agsleiloes: Scraper = {
  url: "www.agsleiloes.com.br",
  search: async (page) => {
    const links: string[] = [];
    const pages = [
      "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=3550308&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
      "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=3550308&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
    ];
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.reload();
      await page.waitForSelector(".dg-leiloes-item");
      await scrollToBottom(page);
      await page.screenshot({
        path: "/tmp/screenshot.png",
        fullPage: true,
      });

      links.push(
        ...(
          await page.evaluate(() =>
            Array.from(document.querySelectorAll(".dg-leiloes-acao > a"))
              .filter(
                (a) =>
                  a.textContent?.includes("Aberto para lance") ||
                  a.textContent?.includes("Aguardando início"),
              )
              .map((a) => a.getAttribute("href")),
          )
        ).filter((link): link is string => link !== undefined),
      );
    }
    return links;
  },
  name: async (page) =>
    (await page.evaluate(
      () => document.querySelector(".dg-lote-titulo > strong")?.textContent,
    )) ?? undefined,
  address: async (page) =>
    (await page.evaluate(
      () => document.querySelector(".dg-lote-local-endereco")?.textContent,
    )) ?? undefined,
  description: async (page) =>
    (await page.evaluate(
      () => document.querySelector(".dg-lote-descricao-txt")?.textContent,
    )) ?? undefined,
  caseNumber: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".dg-lote-descricao-info > div"))
          .find((div) => div.textContent?.includes("Número do Processo: "))
          ?.textContent?.match(
            /Processo:\s*(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/,
          )![1],
    ),
  caseLink: async (page) =>
    await page.evaluate(
      () =>
        Array.from(
          document.querySelectorAll(".dg-lote-descricao-info > div > a"),
        )
          .find((a) => a.getAttribute("href")?.includes("processo.codigo"))
          ?.getAttribute("href") ?? undefined,
    ),
  bid: async (page) =>
    realToNumber(
      await page.evaluate(
        () => document.querySelector(".BoxLanceValor")?.textContent,
      ),
    ),
  appraisal: async (page) =>
    realToNumber(
      await page.evaluate(
        () => document.querySelector(".ValorAvaliacao")?.textContent,
      ),
    ),
  firstAuctionDate: async (page) =>
    parseBrazilianDate(
      await page.evaluate(
        () => document.querySelector(".Praca1DataHoraAbertura")?.textContent,
      ),
      "dd/MM/yyyy - HH:mm",
    ),
  firstAuctionBid: async (page) =>
    realToNumber(
      await page.evaluate(
        () =>
          document.querySelector(".ValorMinimoLancePrimeiraPraca")?.textContent,
      ),
    ),
  secondAuctionDate: async (page) =>
    parseBrazilianDate(
      await page.evaluate(
        () => document.querySelector(".Praca2DataHoraAbertura")?.textContent,
      ),
      "dd/MM/yyyy - HH:mm",
    ),
  secondAuctionBid: async (page) =>
    realToNumber(
      await page.evaluate(
        () =>
          document.querySelector(".ValorMinimoLanceSegundaPraca")?.textContent,
      ),
    ),
  images: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".slick-track > a > img"))
          .map((a) => a.getAttribute("src"))
          .filter((href): href is string => href !== null) ?? [],
    ),
  laudo_link: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".dg-lote-anexos li a"))
          .find((a) => a.textContent?.includes("Laudo de Avaliação"))
          ?.getAttribute("href") ?? undefined,
    ),
  matricula_link: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".dg-lote-anexos li a"))
          .find((a) => a.textContent?.includes("Matrícula"))
          ?.getAttribute("href") ?? undefined,
    ),
  edital_link: async (page) =>
    await page.evaluate(
      () =>
        Array.from(document.querySelectorAll(".dg-lote-anexos li a"))
          .find((a) => a.textContent?.includes("Edital do Leilão"))
          ?.getAttribute("href") ?? undefined,
    ),
};
