export interface IFile {
  exists(): Promise<boolean>;
  extension(): string;
  path(): string;
  localPath(): string;
  write(content: Buffer): Promise<void>;
  read(): Promise<Buffer>;
  download(): Promise<void>;
  md5(encoding: "hex" | "base64"): Promise<string>;
}
