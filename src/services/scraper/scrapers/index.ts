import { Scraper } from "@/services/scraper/scraper";
import {
  Agsleiloes,
  GfLeiloes,
  VivaLeiloes,
} from "@/services/scraper/scrapers/degrau-publicidade";
import { PortalZuk } from "@/services/scraper/scrapers/portal-zuk";
import { Wspleiloes } from "@/services/scraper/scrapers/wspleiloes";

export const scrapers: Scraper[] = [
  Wspleiloes,
  Agsleiloes,
  VivaLeiloes,
  GfLeiloes,
  PortalZuk,
];

export function getScraper(url: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === url);
}
