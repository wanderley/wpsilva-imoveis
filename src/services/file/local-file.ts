import { getFilesPath } from "@/lib/env";
import { SystemError } from "@/lib/error";
import { IFile } from "@/services/file/types";
import fs from "fs";
import path from "path";

export class LocalFile implements IFile {
  constructor(private readonly filePath: string) {}

  async exists(): Promise<boolean> {
    return fs.existsSync(this.localPath());
  }

  path(): string {
    return this.filePath;
  }

  extension(): string {
    return path.extname(this.filePath);
  }

  localPath(): string {
    return path.join(getFilesPath(), "local", this.filePath);
  }

  async touch(): Promise<void> {
    if (!(await this.exists())) {
      await fs.promises.mkdir(path.dirname(this.localPath()), {
        recursive: true,
      });
      await fs.promises.writeFile(this.localPath(), new Uint8Array());
    }
    await fs.promises.utimes(this.localPath(), new Date(), new Date());
  }

  async write(content: Buffer | string): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(this.localPath()), {
        recursive: true,
      });
      await fs.promises.writeFile(this.localPath(), content);
    } catch (error) {
      throw new SystemError(
        `Error writing to temp file ${this.localPath()}: ${error}`,
        error,
        { filePath: this.localPath() },
      );
    }
  }

  async read(): Promise<Buffer> {
    try {
      return await fs.promises.readFile(this.localPath());
    } catch (error) {
      throw new SystemError(
        `Error reading from temp file ${this.localPath()}: ${error}`,
        error,
        { filePath: this.localPath() },
      );
    }
  }

  async download(): Promise<void> {}
}

export class LocalDir {
  constructor(private readonly dirPath: string) {}

  public localPath(): string {
    return path.join(getFilesPath(), "local", this.dirPath);
  }

  public async exists(): Promise<boolean> {
    return fs.existsSync(this.localPath());
  }

  public async create(): Promise<void> {
    await fs.promises.mkdir(this.localPath(), { recursive: true });
  }

  public async delete(): Promise<void> {
    await fs.promises.rmdir(this.localPath(), { recursive: true });
  }

  public async listFiles(): Promise<LocalFile[]> {
    if (!(await this.exists())) {
      return [];
    }
    const files = await fs.promises.readdir(this.localPath());
    return files
      .map((file) => new LocalFile(path.join(this.dirPath, file)))
      .sort((a, b) => a.path().localeCompare(b.path()));
  }
}
