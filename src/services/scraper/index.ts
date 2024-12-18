import { Scraper } from "@/services/scraper/scraper";
import {
  Agsleiloes,
  GfLeiloes,
  VivaLeiloes,
} from "@/services/scraper/scrapers/degrau-publicidade";
import { Wspleiloes } from "@/services/scraper/scrapers/wspleiloes";

import { PortalZuk } from "./scrapers/portal-zuk";

export const scrapers: Scraper[] = [
  Wspleiloes,
  Agsleiloes,
  VivaLeiloes,
  GfLeiloes,
  PortalZuk,
];

export function getScraper(scraperID: string): Scraper | undefined {
  return scrapers.find((scraper) => scraper.url === scraperID);
}
