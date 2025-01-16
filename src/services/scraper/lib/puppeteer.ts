import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import ReplPlugin from "puppeteer-extra-plugin-repl";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());
puppeteer.use(ReplPlugin());

const isHeadless = (process.env.SCRAPER_HEADLESS || "true") === "true";

export async function launchBrowser(scrapers: string[]): Promise<Browser> {
  const browser = await puppeteer.launch({
    args: [
      // TODO: Remove this once we have a proper way to run the scraper
      "--no-sandbox",
      "--disable-setuid-sandbox",
      ...scrapers,
    ],
    headless: isHeadless,
  });
  await waitBrowserToBeReady(browser, scrapers);
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

export async function waitPageToBeReady(page: Page) {
  let timeout = 1000;
  let retries = 0;
  const maxRetries = 5;
  while (
    retries < maxRetries &&
    (await page.evaluate(() =>
      document.body.innerText.includes(
        "has banned you temporarily from accessing this website",
      ),
    ))
  ) {
    console.log("Waiting for page to be ready");
    await new Promise((resolve) => setTimeout(resolve, timeout));
    await page.reload({ waitUntil: "load" });
    timeout *= 2;
    retries++;
  }
  if (retries === maxRetries) {
    throw new Error(`Access to ${page.url()} is blocked`);
  }
}

async function waitBrowserToBeReady(browser: Browser, scrapers: string[]) {
  if (scrapers.length === 0) {
    return;
  }

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
