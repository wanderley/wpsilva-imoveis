import { Scraper } from "@/services/scraper/scraper";
import {
  IncludesFinder,
  NoFilters,
  ReturnAttribute,
  ReturnText,
  getBrazilianDate,
  getFromSelector,
  getFromSelectorAll,
  getNumberFromReais,
  getTextFromSelector,
  matchText,
  or,
  pipe,
  removeUnnecessarySpaces,
} from "@/services/scraper/scrapers/lib/extractors";

export const PortalZuk: Scraper = {
  url: "www.portalzuk.com.br",
  login: async (page) => {
    const username = process.env.SCRAPER_PORTAL_ZUK_EMAIL;
    const password = process.env.SCRAPER_PORTAL_ZUK_PASSWORD;
    if (username === undefined || password === undefined) {
      throw new Error(
        "SCRAPER_PORTAL_ZUK_EMAIL or SCRAPER_PORTAL_ZUK_PASSWORD is not set",
      );
    }
    // we can use this to login, but it's not necessary
    // await page.setCookie({
    //   name: "laravel_session",
    //   value: "<<COOKIE_VALUE>>",
    //   expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    //   path: "/",
    //   domain: "www.portalzuk.com.br",
    // });
    await page.goto("https://www.portalzuk.com.br/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("nav.menu-nav a.logo");
    if (await page.$("a[href='https://www.portalzuk.com.br/login']")) {
      console.info("[PortalZuk] Logging in");
      await page.goto("https://www.portalzuk.com.br/login", {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector("[name=email]");
      await page.type("[name=email]", username);
      await page.type("[name=password]", password);
      await Promise.all([
        page.click(".login-buttons button[type=submit]"),
        page.waitForNavigation(),
      ]);
      if (await page.$(".card-status-warning")) {
        throw new Error("Login failed");
      }
    }
    if (await page.$(".modal.show #close-modal-virada")) {
      await page.click(".modal.show #close-modal-virada");
    }
  },
  search: async (page) => {
    await page.goto(
      "https://www.portalzuk.com.br/leilao-de-imoveis/tl/residenciais/leilao-judicial/u/sp",
    );
    // to play safe, we'll try to load up to 20 times
    for (let i = 0; i < 20; i++) {
      try {
        // the load button changes text when it's clicked, so we need to wait for it
        // to change to "Carregar mais" before clicking it again.
        await page.waitForFunction(() => {
          const elem = document.querySelector("#btn_carregarMais");
          if (elem === null) {
            return true;
          }
          return elem.textContent === "Carregar mais";
        });
        await page.click("#btn_carregarMais");
      } catch (_e) {
        break;
      }
    }
    const links: string[] = await getFromSelectorAll(
      ".list-content-wrapper .card-property .card-property-image-wrapper a",
      NoFilters(),
      ReturnAttribute("href"),
    )(page);
    return links;
  },
  fetch: async (page, url) => {
    const cookies = await page.cookies();
    const response = await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=0, i",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-site",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; "),
        Referer: "https://www.portalzuk.com.br/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    });
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  },
  waitUntilLoaded: async (page) => {
    if (await page.$("#box-redirect-encerrado a")) {
      const link = await page.evaluate(() =>
        document
          .querySelector("#box-redirect-encerrado a")
          ?.getAttribute("href"),
      );
      if (link) {
        await Promise.all([page.goto(link), page.waitForNavigation()]);
      }
    }
    await page.waitForSelector("nav.menu-nav a.logo");
  },
  status: async (page) => {
    // when the auction is closed without any bids, the page is redirected to the
    // auction search page, so we need to check if the page has a auction data
    // to determine if it's closed or not.
    //
    // Note that the page won't redirect if the auction is closed with a bid.
    // In this case, the page will have auction data but won't have most of
    // the information that it had before as for example the the auction dates.
    const isLoaded = !!(await page.$(".imovel-main"));
    if (!isLoaded) {
      return "closed";
    }
    const isSold = !!(await getFromSelector(
      ".card-action-closed-label",
      IncludesFinder("Este lote já foi vendido."),
      ReturnText(),
    )(page));
    if (isSold) {
      return "sold";
    }
    const isOpenForBids = !!(await getDate("1º Leilão")(page));
    if (isOpenForBids) {
      return "open-for-bids";
    }
    console.error("Unknown status");
    return "unknown";
  },
  name: pipe(
    getTextFromSelector(".property-main-content .content .title"),
    removeUnnecessarySpaces,
  ),
  address: pipe(
    getTextFromSelector(".property-address"),
    removeUnnecessarySpaces,
  ),
  description: getTextFromSelector(".content"),
  caseNumber: getTextFromSelector("#itens_processo"),
  caseLink: pipe(
    getFromSelector(
      ".property-description-items .glossary-wrapper a.glossary-link",
      IncludesFinder("Acessar processo"),
      ReturnAttribute("href"),
    ),
    removeUnnecessarySpaces,
  ),
  bid: pipe(
    or(
      getTextFromSelector(".maior-lance-vlr"),
      getTextFromSelector("#maior-lance-vlr"),
    ),
    (value) => (value == "0,00" ? undefined : value),
    getNumberFromReais,
  ),
  appraisal: getBid("1º Leilão"),
  firstAuctionDate: getDate("1º Leilão"),
  firstAuctionBid: getBid("1º Leilão"),
  secondAuctionDate: getDate("2º Leilão"),
  secondAuctionBid: getBid("2º Leilão"),
  images: getFromSelectorAll(
    ".property-gallery .swiper-slide img",
    NoFilters(),
    ReturnAttribute("src"),
  ),
  laudoLink: pipe(
    getFromSelector(
      "#section-documents a",
      IncludesFinder("Laudo de Avaliação"),
      ReturnAttribute("href"),
    ),
    removeUnnecessarySpaces,
  ),
  matriculaLink: pipe(
    getFromSelector(
      "#section-documents a",
      IncludesFinder("Matricula do Imóvel"),
      ReturnAttribute("href"),
    ),
    removeUnnecessarySpaces,
  ),
  editalLink: pipe(
    getFromSelector(
      "#section-documents a",
      IncludesFinder("Edital de venda"),
      ReturnAttribute("href"),
    ),
    removeUnnecessarySpaces,
  ),
};

function getDate(text: string) {
  return pipe(
    getFromSelector(".card-action-item", IncludesFinder(text), ReturnText()),
    matchText(
      /(\d{2}\/\d{2}\/\d{2}) às (\d{2})h(\d{2})/,
      (_, day, hour, minute) => `${day} ${hour}:${minute}`,
    ),
    getBrazilianDate("dd/MM/yy HH:mm"),
  );
}

function getBid(text: string) {
  return pipe(
    getFromSelector(".card-action-item", IncludesFinder(text), ReturnText()),
    matchText(/R\$\s(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/),
    getNumberFromReais,
  );
}
