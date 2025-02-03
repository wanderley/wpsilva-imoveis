import { getFilesPath } from "@/lib/env";
import { IFile } from "@/services/file/types";
import path from "path";

export abstract class AbstractFile implements IFile {
  constructor(readonly filePath: string) {}
  abstract exists(): Promise<boolean>;
  abstract write(content: Buffer): Promise<void>;
  abstract read(): Promise<Buffer>;
  abstract download(): Promise<void>;

  path(): string {
    return this.filePath;
  }

  localPath(): string {
    return path.join(getFilesPath(), this.filePath);
  }

  extension(): string {
    return path.extname(this.filePath);
  }
}
