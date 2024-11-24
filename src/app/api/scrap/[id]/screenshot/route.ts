import { getScrapScreenshotPath } from "@/features/auction/scrap/helpers";
import fs from "fs";

export async function GET(
  _request: Request,
  { params }: { params: { id: number } },
) {
  const screenshotPath = getScrapScreenshotPath(params.id);
  const stat = fs.statSync(screenshotPath);
  const fileSize = stat.size;

  const head = {
    "Content-Length": fileSize.toString(),
    "Content-Type": "image/png",
  };

  const file = await fs.promises.readFile(screenshotPath);
  return new Response(file, {
    headers: head,
  });
}
