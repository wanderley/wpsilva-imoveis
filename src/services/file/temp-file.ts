import { SystemError } from "@/lib/error";
import { IFile } from "@/services/file/types";
import fs from "fs";
import path from "path";

export class TempFile implements IFile {
  constructor(private readonly filePath: string) {}

  async exists(): Promise<boolean> {
    return await fs.existsSync(this.fullPath());
  }

  path(): string {
    return this.filePath;
  }

  fullPath(): string {
    return path.join("/tmp/wpsilva-imoveis/temporary-files/", this.filePath);
  }

  async touch(): Promise<void> {
    if (!(await this.exists())) {
      await fs.promises.mkdir(path.dirname(this.fullPath()), {
        recursive: true,
      });
      await fs.promises.writeFile(this.fullPath(), new Uint8Array());
    }
    await fs.promises.utimes(this.fullPath(), new Date(), new Date());
  }

  async write(content: Uint8Array): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(this.fullPath()), {
        recursive: true,
      });
      await fs.promises.writeFile(this.fullPath(), content);
    } catch (error) {
      throw new SystemError(
        `Error writing to temp file ${this.fullPath()}: ${error}`,
        error,
        { filePath: this.fullPath() },
      );
    }
  }

  async read(): Promise<Uint8Array> {
    try {
      return await fs.promises.readFile(this.fullPath());
    } catch (error) {
      throw new SystemError(
        `Error reading from temp file ${this.fullPath()}: ${error}`,
        error,
        { filePath: this.fullPath() },
      );
    }
  }
}
