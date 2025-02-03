import { LocalFile } from "@/services/file/local-file";
import { IFile } from "@/services/file/types";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function extractTextFromPdfWithTika(file: IFile) {
  const cacheFile = new LocalFile(
    `cache/apache-tika-3.0.0/${file.path()}/${await file.md5("hex")}.txt`,
  );
  if (await cacheFile.exists()) {
    return (await cacheFile.read()).toString("utf-8");
  }
  const result = (
    await execAsync(
      `java -jar ${process.cwd()}/src/services/pdf/bin/tika-app-3.0.0.jar -T ${file.localPath()}`,
    )
  ).stdout;
  await cacheFile.write(result);
  return result;
}
