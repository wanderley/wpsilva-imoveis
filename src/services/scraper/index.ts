import { Scraper } from "@/services/scraper/scraper";
import {
  Agsleiloes,
  VivaLeiloes,
} from "@/services/scraper/scrapers/degrau-publicidade";
import { Wspleiloes } from "@/services/scraper/scrapers/wspleiloes";

export const scrapers: Scraper[] = [Wspleiloes, Agsleiloes, VivaLeiloes];

export function getScraper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
