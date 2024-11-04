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
} from "@/services/scraper/parsers";
import { Scraper, scrollToBottom } from "@/services/scraper/scraper";

function build(url: string, pages: string[]): Scraper {
  return {
    url,
    search: async (page) => {
      const links: string[] = [];
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.reload();
        const countResults = await getTextFromSelector("#CountTotal")(page);
        if (countResults !== "0") {
          await page.waitForSelector(".dg-leiloes-item");
          await scrollToBottom(page);
        }
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
      matchCaseNumber,
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
      getTextFromSelector(".Praca1DataHoraAbertura"),
      getBrazilianDate("dd/MM/yyyy - HH:mm"),
    ),
    firstAuctionBid: pipe(
      getTextFromSelector(".ValorMinimoLancePrimeiraPraca"),
      getNumberFromReais,
    ),
    secondAuctionDate: pipe(
      getTextFromSelector(".Praca2DataHoraAbertura"),
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
    laudo_link: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Laudo de Avaliação"),
      ReturnAttribute("href"),
    ),
    matricula_link: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Matrícula"),
      ReturnAttribute("href"),
    ),
    edital_link: getFromSelector(
      ".dg-lote-anexos li a",
      IncludesFinder("Edital do Leilão"),
      ReturnAttribute("href"),
    ),
  };
}

export const Agsleiloes: Scraper = build("www.agsleiloes.com.br", [
  "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
  "https://www.agsleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&Scopo=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=3&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
]);

export const VivaLeiloes: Scraper = {
  ...build("www.vivaleiloes.com.br", [
    "https://www.vivaleiloes.com.br/busca/#Engine=Start&Pagina=1&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=200&ID_Leiloes_Status=1,3&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[%22Judicial%22]&CFGs=[]",
    "https://www.vivaleiloes.com.br/busca/#Engine=Start&Pagina=1&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=&Bairro=&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=200&ID_Leiloes_Status=1,3&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[%22Judicial%22]&CFGs=[]",
  ]),
  name: pipe(getTextFromSelector(".dg-titulo"), removeUnnecessarySpaces),
  edital_link: getFromSelector(
    ".dg-lote-anexos li a",
    IncludesFinder("Edital"),
    ReturnAttribute("href"),
  ),
};

export const GfLeiloes: Scraper = {
  ...build("www.gfleiloes.com.br", [
    "https://www.gfleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=56&ID_Estado=35&ID_Cidade=-1&Bairro=-1&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
    "https://www.gfleiloes.com.br/busca/#Engine=Start&Pagina=1&RangeValores=0&OrientacaoBusca=0&Busca=&Mapa=&ID_Categoria=57&ID_Estado=35&ID_Cidade=-1&Bairro=-1&ID_Regiao=0&ValorMinSelecionado=0&ValorMaxSelecionado=0&Ordem=0&QtdPorPagina=100&ID_Leiloes_Status=&SubStatus=&PaginaIndex=1&BuscaProcesso=&NomesPartes=&CodLeilao=&TiposLeiloes=[]&CFGs=[]",
  ]),
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
    matchCaseNumber,
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
