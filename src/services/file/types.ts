export interface IFile {
  exists(): Promise<boolean>;
  extension(): string;
  path(): string;
  localPath(): string;
  write(content: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array>;
  download(): Promise<void>;
}
