import { regularFetch } from "@/services/scraper/lib/fetch";
import {
  IncludesFilter,
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
import { Scraper, notFound } from "@/services/scraper/scraper";

// ATENÇÃO: NÃO ESTÁ FUNCIONANDO
// TODO: Não deixa acessar imagens fora do domínio do site
// TODO: Não deixa baixar arquivos fora do domínio do site
// Fora esses problemas, o scraper está funcionando.

export const VallandLeiloes: Scraper = {
  url: "www.valland.com.br",
  search: async (page) => {
    const links: string[] = [];
    for (const url of [
      "https://www.valland.com.br/busca?id_categoria=2&id_sub_categoria=78&localidade=S%C3%A3o+Paulo&data=&id_leilao=&palavra=",
      "https://www.valland.com.br/busca?id_categoria=&id_sub_categoria=79&localidade=S%C3%A3o+Paulo&data=&id_leilao=&palavra=",
    ]) {
      await page.goto(url);
      while (true) {
        const lotes = await getFromSelectorAll(
          ".card-leilao .card-footer a",
          IncludesFilter("Ver Lote"),
          ReturnAttribute("href"),
        )(page);
        links.push(...lotes);
        try {
          await page.click(".fas.fa-angle-right");
        } catch (_) {
          break;
        }
      }
    }

    return links;
  },
  fetch: regularFetch,
  status: notFound,
  name: pipe(getTextFromSelector(".pageLote h4"), removeUnnecessarySpaces),
  address: pipe(
    getTextFromSelector(".conteudo"),
    (text) => {
      const match = text.match(/Local Depositado: ([^\t]+)\t+([^\t]+)+/);
      if (match === null) {
        return undefined;
      }
      return `${match[1]} ${match[2]}`;
    },
    removeUnnecessarySpaces,
  ),
  description: pipe(getTextFromSelector(".conteudo"), removeUnnecessarySpaces),
  caseNumber: pipe(
    getFromSelector("dl", IncludesFinder("Número do Processo"), ReturnText()),
    matchCaseNumber("Processo"),
  ),
  caseLink: notFound,
  bid: notFound,
  appraisal: pipe(getTextFromSelector(".avaliacao_box dd"), getNumberFromReais),
  firstAuctionDate: pipe(
    getFromSelector("dl", IncludesFinder("Valor - 1ª Praça"), ReturnText()),
    (text) => text.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1],
    getBrazilianDate("dd/MM/yyyy"),
  ),
  firstAuctionBid: pipe(
    getFromSelector("dl", IncludesFinder("Valor - 1ª Praça"), ReturnText()),
    (text) => text.match(/R\$\s*(.*)/)?.[1],
    getNumberFromReais,
  ),
  secondAuctionDate: pipe(
    getFromSelector("dl", IncludesFinder("Valor - 2ª Praça"), ReturnText()),
    (text) => text.match(/(\d{2}\/\d{2}\/\d{4})/)?.[1],
    getBrazilianDate("dd/MM/yyyy"),
  ),
  secondAuctionBid: pipe(
    getFromSelector("dl", IncludesFinder("Valor - 2ª Praça"), ReturnText()),
    (text) => text.match(/R\$\s*(.*)/)?.[1],
    getNumberFromReais,
  ),
  images: getFromSelectorAll(
    ".owl-stage img",
    NoFilters(),
    ReturnAttribute("src"),
  ),
  laudoLink: getFromSelector(
    ".arquivos a",
    IncludesFinder("Avaliação"),
    ReturnAttribute("href"),
  ),
  matriculaLink: getFromSelector(
    ".arquivos a",
    IncludesFinder("Matrícula"),
    ReturnAttribute("href"),
  ),
  editalLink: getFromSelector(
    ".arquivos a",
    IncludesFinder("Edital do Leilão"),
    ReturnAttribute("href"),
  ),
};
