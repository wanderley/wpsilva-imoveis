import {
  AttributeIncludesFinder,
  IncludesFinder,
  NoFilters,
  ReturnAttribute,
  ReturnText,
  getBrazilianDate,
  getFromSelector,
  getFromSelectorAll,
  getNumberFromReais,
  getTextFromSelector,
  matchCaseNumber,
  pipe,
  removeUnnecessarySpaces,
  replaceText,
} from "@/services/scraper/parsers";
import { Scraper } from "@/services/scraper/scraper";

function build(url: string, pages: string[]): Scraper {
  return {
    url,
    search: async (page) => {
      const links: string[] = [];
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        do {
          await page.evaluate(() => {
            const footer = document.querySelector("#footer");
            if (footer) {
              footer.scrollIntoView({ behavior: "instant", block: "end" });
            }
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        } while (await page.$(".dg-loading-local"));
        links.push(
          ...(
            await page.evaluate(() =>
              Array.from(document.querySelectorAll(".dg-leiloes-acao > a"))
                .filter((a) =>
                  [
                    "Aberto para lance",
                    "Aguardando início",
                    "Leilão suspenso",
                    "Leilão arrematado",
                    "Leilão encerrado",
                  ].some((status) => a.textContent?.includes(status)),
                )
                .map((a) => a.getAttribute("href")),
            )
          ).filter((link): link is string => link !== undefined),
        );
      }
      return links;
    },
    status: pipe(getTextFromSelector(".BoxBtLoteLabel"), (status) => {
      switch (status) {
        case "Aguardando início":
          return "waiting-to-start";
        case "Aberto para lance":
          return "open-for-bids";
        case "Leilão arrematado":
          return "sold";
        case "Leilão encerrado":
          return "closed";
        case "Leilão prejudicado":
          return "impaired";
        case "Leilão suspenso":
          return "suspended";
        default:
          console.error(
            `[www.degrau-publicidade.com.br] Unknown status: ${status}`,
          );
          return "unknown";
      }
    }),
    name: pipe(
      getTextFromSelector(".dg-lote-titulo > strong"),
      removeUnnecessarySpaces,
    ),
    address: pipe(
      getTextFromSelector(".dg-lote-local-endereco"),
      removeUnnecessarySpaces,
    ),
    description: getTextFromSelector(".dg-lote-descricao-txt"),
    caseNumber: pipe(
      getFromSelector(
        ".dg-lote-descricao-info > div",
        IncludesFinder("Número do Processo: "),
        ReturnText(),
      ),
      matchCaseNumber("Processo:"),
    ),
    caseLink: pipe(
      getFromSelector(
        ".dg-lote-descricao-info > div > a",
        AttributeIncludesFinder("href", "processo.codigo"),
        ReturnAttribute("href"),
      ),
      removeUnnecessarySpaces,
    ),
    bid: pipe(getTextFromSelector(".BoxLanceValor"), getNumberFromReais),
    appraisal: pipe(getTextFromSelector(".ValorAvaliacao"), getNumberFromReais),
    firstAuctionDate: pipe(
      getTextFromSelector(".Praca1DataHoraEncerramento"),
      getBrazilianDate("dd/MM/yyyy - HH:mm"),
    ),
    firstAuctionBid: pipe(
      getTextFromSelector(".ValorMinimoLancePrimeiraPraca"),
      getNumberFromReais,
    ),
    secondAuctionDate: pipe(
      getTextFromSelector(".Praca2DataHoraEncerramento"),
      getBrazilianDate("dd/MM/yyyy - HH:mm"),
    ),
    secondAuctionBid: pipe(
      getTextFromSelector(".ValorMinimoLanceSegundaPraca"),
      getNumberFromReais,
    ),
    images: getFromSelectorAll(
      ".slick-track > a > img",
      NoFilters(),
      ReturnAttribute("src"),
    ),
    laudoLink: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Laudo de Avaliação"),
      ReturnAttribute("href"),
    ),
    matriculaLink: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Matrícula"),
      ReturnAttribute("href"),
    ),
    editalLink: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Edital do Leilão"),
      ReturnAttribute("href"),
    ),
  };
}

export const Agsleiloes: Scraper = build("www.agsleiloes.com.br", [
  "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=200&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
  "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=200&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
]);

export const VivaLeiloes: Scraper = {
  ...build("www.vivaleiloes.com.br", [
    "https://www.vivaleiloes.com.br/busca/#Engine=Start&Pagina=1&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=200&ID_Leiloes_Status=1,3&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[%22Judicial%22]&CFGs=[]",
    "https://www.vivaleiloes.com.br/busca/#Engine=Start&Pagina=1&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=200&ID_Leiloes_Status=1,3&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[%22Judicial%22]&CFGs=[]",
  ]),
  waitUntilLoaded: async (_page) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  },
  name: pipe(getTextFromSelector(".dg-titulo"), removeUnnecessarySpaces),
  editalLink: getFromSelector(
    ".dg-lote-anexos li a",
    IncludesFinder("Edital"),
    ReturnAttribute("href"),
  ),
  address: pipe(
    getFromSelector(
      ".dg-lote-descricao-txt p span span",
      IncludesFinder("Endereço:"),
      ReturnText(),
    ),
    replaceText("Endereço:", ""),
    removeUnnecessarySpaces,
  ),
};

export const GfLeiloes: Scraper = {
  ...build("www.gfleiloes.com.br", [
    "https://www.gfleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=-1&Bairro=-1&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
    "https://www.gfleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=-1&Bairro=-1&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
  ]),
  waitUntilLoaded: async (page) => {
    await page.waitForResponse((response) =>
      response.url().includes("GetRealTime"),
    );
  },
  name: pipe(getTextFromSelector(".dg-lote-titulo"), removeUnnecessarySpaces),
  bid: async (page) => {
    const bid = await pipe(
      getTextFromSelector(".BoxLanceValor"),
      getNumberFromReais,
    )(page);
    if (bid === undefined || bid === 0) {
      return undefined;
    }
    return bid;
  },
  caseNumber: pipe(
    getFromSelector(
      ".dg-lote-descricao-info > li",
      IncludesFinder("Número do Processo: "),
      ReturnText(),
    ),
    matchCaseNumber("Processo:"),
  ),
  caseLink: pipe(
    getFromSelector(
      ".dg-lote-descricao-info > li > a",
      AttributeIncludesFinder("href", "processo.codigo"),
      ReturnAttribute("href"),
    ),
    removeUnnecessarySpaces,
  ),
};
