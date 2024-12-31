import fs from "fs";
import path from "path";

export function getScrapScreencastPath(scrapID: number): `${string}.webm` {
  const folder = process.env.SCRAPER_SCRAP_SCREENCAST_FOLDER;
  if (!folder) {
    throw new Error("SCRAPER_SCRAP_SCREENCAST_FOLDER is not set");
  }
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  return path.join(folder, `scrap-${scrapID}.webm`) as `${string}.webm`;
}

export function getScrapScreenshotPath(scrapID: number): `${string}.png` {
  const folder = process.env.SCRAPER_SCRAP_SCREENCAST_FOLDER;
  if (!folder) {
    throw new Error("SCRAPER_SCRAP_SCREENCAST_FOLDER is not set");
  }
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  return path.join(folder, `scrap-${scrapID}.png`) as `${string}.png`;
}
