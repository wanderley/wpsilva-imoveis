import { IFile } from "@/services/file/types";

export abstract class AbstractFile implements IFile {
  constructor(readonly filePath: string) {}
  abstract exists(): Promise<boolean>;
  abstract extension(): string;
  abstract path(): string;
  abstract localPath(): string;
  abstract write(content: Buffer): Promise<void>;
  abstract read(): Promise<Buffer>;
  abstract download(): Promise<void>;
}
