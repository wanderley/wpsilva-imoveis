import { Page } from "puppeteer";

export type Lot = {
  name: string;
  address: string;
  description: string;
  caseNumber?: string | null;
  caseLink?: string | null;
  bid?: number | null;
  appraisal?: number | null;
  firstAuctionDate?: string | null;
  firstAuctionBid?: number | null;
  secondAuctionDate?: string | null;
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
  address: (page: Page) => Promise<string>;
  description: (page: Page) => Promise<string | undefined>;
  caseNumber: (page: Page) => Promise<string | undefined>;
  caseLink: (page: Page) => Promise<string | undefined>;
  bid: (page: Page) => Promise<number | undefined>;
  appraisal: (page: Page) => Promise<number | undefined>;
  firstAuctionDate: (page: Page) => Promise<string | undefined>;
  firstAuctionBid: (page: Page) => Promise<number | undefined>;
  secondAuctionDate: (page: Page) => Promise<string | undefined>;
  secondAuctionBid: (page: Page) => Promise<number | undefined>;
  images: (page: Page) => Promise<Array<string>>;
  laudo_link: (page: Page) => Promise<string | undefined>;
  matricula_link: (page: Page) => Promise<string | undefined>;
  edital_link: (page: Page) => Promise<string | undefined>;
};

export async function notFound<T>(_page: Page): Promise<T | undefined> {
  return undefined;
}
