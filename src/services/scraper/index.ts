import { Scraper } from "@/services/scraper/scraper";
import { Agsleiloes } from "@/services/scraper/scrapers/agsleiloes";
import { Wspleiloes } from "@/services/scraper/scrapers/wspleiloes";

export const scrapers: Scraper[] = [Wspleiloes, Agsleiloes];

export function getScraper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
