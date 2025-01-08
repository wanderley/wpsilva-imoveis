import { Scraper } from "@/services/scraper/scraper";
import { scrapers } from "@/services/scraper/scrapers";

export function getScraper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
