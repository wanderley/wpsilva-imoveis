import { Scraper } from "@/scraper/scraper";
import { Wspleiloes } from "@/scraper/scrapers/wspleiloes";

export const scrapers: Scraper[] = [Wspleiloes];

export function getScrapper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
