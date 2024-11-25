import { ScrapAuctionStatus } from "@/db/schema";
import { Page } from "puppeteer";

export type Lot = {
  name?: string;
  address?: string;
  description?: string;
  status?: ScrapAuctionStatus;
  caseNumber?: string;
  caseLink?: string;
  bid?: number;
  appraisal?: number;
  firstAuctionDate?: Date;
  firstAuctionBid?: number;
  secondAuctionDate?: Date;
  secondAuctionBid?: number;
  images: Array<string>;
  laudoLink?: string;
  matriculaLink?: string;
  editalLink?: string;
};

export type Scraper = {
  url: string;
  login?: (page: Page) => Promise<void>;
  waitUntilLoaded?: (page: Page) => Promise<void>;
  search: (page: Page) => Promise<Array<string>>;
  status: (page: Page) => Promise<ScrapAuctionStatus | undefined>;
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
  laudoLink: (page: Page) => Promise<string | undefined>;
  matriculaLink: (page: Page) => Promise<string | undefined>;
  editalLink: (page: Page) => Promise<string | undefined>;
};

export async function notFound<T>(_page: Page): Promise<T | undefined> {
  return undefined;
}

export function identity<T>(value: T): (_page: Page) => Promise<T> {
  return async (_page: Page) => value;
}

export async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
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
