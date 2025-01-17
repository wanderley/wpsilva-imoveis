export interface IFile {
  exists(): Promise<boolean>;
  path(): string;
  fullPath(): string;
  write(content: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array>;
}
