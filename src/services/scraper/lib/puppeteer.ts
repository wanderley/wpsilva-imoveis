import { scrapers } from "@/services/scraper/scrapers";
import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

const isHeadless = (process.env.SCRAPER_HEADLESS || "true") === "true";
const shouldLoadScraperUrlsAtStart =
  (process.env.SCRAPER_LOAD_SCRAPER_URLS_AT_START || "false") === "true";

export async function launchBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    args: getArgs(),
    headless: isHeadless,
  });
  await waitBrowserToBeReady(browser);
  return browser;
}

export async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  if (isHeadless) {
    await page.setViewport({ width: 1080, height: 1024 });
    await page.setUserAgent(
      // This user agent string can help bypass Cloudflare's bot protection, but it works only sometimes
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    );
  }
  return page;
}

function getArgs() {
  const args = [
    // TODO: Remove this once we have a proper way to run the scraper
    "--no-sandbox",
    "--disable-setuid-sandbox",
  ];

  if (shouldLoadScraperUrlsAtStart) {
    args.push(...scrapers.map((scraper) => scraper.url));
  }
  return args;
}

async function waitBrowserToBeReady(browser: Browser) {
  if (shouldLoadScraperUrlsAtStart) {
    let done = false;
    await new Promise((resolve) => setTimeout(resolve, 3000));
    while (!done) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const loadStatus = await Promise.all(
        (await browser.pages()).map(
          async (page) =>
            await page.evaluate(() => [
              window.location.href,
              document.readyState === "complete",
            ]),
        ),
      );
      const notLoadedPages = loadStatus.filter(([_, ready]) => !ready);
      if (notLoadedPages.length > 0) {
        console.log(
          "[browser-launch] Waiting for pages to load:",
          notLoadedPages.map(([url]) => url).join(", "),
        );
      }
      done = notLoadedPages.length === 0;
    }
  }
}
