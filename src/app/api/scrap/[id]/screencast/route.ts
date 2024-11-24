import { getScrapScreencastPath } from "@/features/auction/scrap/helpers";
import fs from "fs";

export async function GET(
  _request: Request,
  { params }: { params: { id: number } },
) {
  const videoPath = getScrapScreencastPath(params.id);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;

  const head = {
    "Content-Length": fileSize.toString(),
    "Content-Type": "video/webm",
  };

  const fileStream = new ReadableStream({
    start(controller) {
      const file = fs.createReadStream(videoPath);
      file.on("data", (chunk) => controller.enqueue(chunk));
      file.on("end", () => controller.close());
      file.on("error", (err) => controller.error(err));
    },
  });

  return new Response(fileStream, {
    headers: head,
  });
}
