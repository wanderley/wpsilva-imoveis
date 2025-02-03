import { SystemFile } from "@/services/file/system-file";
import fs from "fs";

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } },
) {
  const filePath = params.path.join("/");
  const file = new SystemFile(filePath);
  await file.download();
  const fileSize = fs.statSync(file.localPath()).size;

  let contentType;
  switch (file.extension()) {
    case ".pdf":
      contentType = "application/pdf";
      break;
    case ".webm":
      contentType = "video/webm";
      break;
    case ".mp4":
      contentType = "video/mp4";
      break;
    case ".jpg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;
    default:
      contentType = "application/octet-stream";
  }

  const fileStream = new ReadableStream({
    start(controller) {
      // TODO: need to implement api to touch the file to make sure that we visit it
      const fileOnDisk = fs.createReadStream(file.localPath());
      fileOnDisk.on("data", (chunk) => controller.enqueue(chunk));
      fileOnDisk.on("end", () => controller.close());
      fileOnDisk.on("error", (err) => controller.error(err));
    },
  });

  return new Response(fileStream, {
    headers: new Headers({
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, immutable",
    }),
  });
}
