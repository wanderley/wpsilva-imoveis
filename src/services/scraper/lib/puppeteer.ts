import puppeteer, { Browser, Page } from "puppeteer";

export async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    // TODO: Remove this once we have a proper way to run the scraper
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });
  await page.setUserAgent(
    // This should dodge cloudflare bot protection
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  );
  return page;
}
