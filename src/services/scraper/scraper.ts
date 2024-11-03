import { Page } from "puppeteer";

export type Lot = {
  name: string;
  address: string | null;
  description: string;
  caseNumber?: string | null;
  caseLink?: string | null;
  bid?: number | null;
  appraisal?: number | null;
  firstAuctionDate?: Date | null;
  firstAuctionBid?: number | null;
  secondAuctionDate?: Date | null;
  secondAuctionBid?: number | null;
  images: Array<string>;
  laudo_link?: string | null;
  matricula_link?: string | null;
  edital_link?: string | null;
};

export type Scraper = {
  url: string;
  search: (page: Page) => Promise<Array<string>>;
  name: (page: Page) => Promise<string | undefined>;
  address: (page: Page) => Promise<string | undefined>;
  description: (page: Page) => Promise<string | undefined>;
  caseNumber: (page: Page) => Promise<string | undefined>;
  caseLink: (page: Page) => Promise<string | undefined>;
  bid: (page: Page) => Promise<number | undefined>;
  appraisal: (page: Page) => Promise<number | undefined>;
  firstAuctionDate: (page: Page) => Promise<Date | undefined>;
  firstAuctionBid: (page: Page) => Promise<number | undefined>;
  secondAuctionDate: (page: Page) => Promise<Date | undefined>;
  secondAuctionBid: (page: Page) => Promise<number | undefined>;
  images: (page: Page) => Promise<Array<string>>;
  laudo_link: (page: Page) => Promise<string | undefined>;
  matricula_link: (page: Page) => Promise<string | undefined>;
  edital_link: (page: Page) => Promise<string | undefined>;
};

export async function notFound<T>(_page: Page): Promise<T | undefined> {
  return undefined;
}

export async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve(void 0);
        }
      }, 100);
    });
  });
}
