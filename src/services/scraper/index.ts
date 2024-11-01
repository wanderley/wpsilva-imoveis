import { Scraper } from "@/services/scraper/scraper";
import { Wspleiloes } from "@/services/scraper/scrapers/wspleiloes";

export const scrapers: Scraper[] = [Wspleiloes];

export function getScraper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
