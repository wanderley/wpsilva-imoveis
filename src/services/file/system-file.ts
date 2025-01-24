import { db } from "@/db";
import { systemFilesTable } from "@/db/schema";
import { getFilesPath, getGoogleCloudStorageSettings } from "@/lib/env";
import { SystemError } from "@/lib/error";
import { IFile } from "@/services/file/types";
import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const SystemFilePath = {
  paginasDoProcessoJudicialPDF: (
    numeroProcesso: string,
    primeiraPagina: number,
    ultimaPagina: number,
  ): SystemFile => {
    const primeiraPaginaFormatada = primeiraPagina.toString().padStart(7, "0");
    const ultimaPaginaFormatada = ultimaPagina.toString().padStart(7, "0");
    return new SystemFile(
      `external/processo-judicial/${numeroProcesso}/${primeiraPaginaFormatada}-${ultimaPaginaFormatada}.pdf`,
    );
  },
  scrapLaudo: (scraperID: string, scrapUrl: string): SystemFile => {
    const scrapUrlHash = crypto
      .createHash("md5")
      .update(scrapUrl)
      .digest("hex");
    return new SystemFile(
      `external/scraper/${scraperID}/${scrapUrlHash}/laudo.pdf`,
    );
  },
  scrapMatricula: (scraperID: string, scrapUrl: string): SystemFile => {
    const scrapUrlHash = crypto
      .createHash("md5")
      .update(scrapUrl)
      .digest("hex");
    return new SystemFile(
      `external/scraper/${scraperID}/${scrapUrlHash}/matricula.pdf`,
    );
  },
  scrapEdital: (scraperID: string, scrapUrl: string): SystemFile => {
    const scrapUrlHash = crypto
      .createHash("md5")
      .update(scrapUrl)
      .digest("hex");
    return new SystemFile(
      `external/scraper/${scraperID}/${scrapUrlHash}/edital.pdf`,
    );
  },
};

export class SystemFile implements IFile {
  constructor(private readonly filePath: string) {}

  async exists(): Promise<boolean> {
    const systemFile = await db.query.systemFilesTable.findFirst({
      where: eq(systemFilesTable.path, this.filePath),
    });
    return systemFile !== undefined;
  }

  path(): string {
    return this.filePath;
  }

  extension(): string {
    return path.extname(this.filePath);
  }

  localPath(): string {
    return path.join(getFilesPath(), this.filePath);
  }

  async write(content: Buffer): Promise<void> {
    // save file to local and upload to Google Cloud Storage
    await fsWriteFile(this.localPath(), content);
    const ourMd5 = crypto.createHash("md5").update(content).digest("base64");
    const gcsMd5 = await uploadGoogleCloudStorage(this.path(), content);
    if (ourMd5 !== gcsMd5) {
      throw new SystemError(
        "File uploaded to Google Cloud Storage has different MD5",
        undefined,
        {
          path: this.path(),
          fullPath: this.localPath(),
          ourMd5,
          gcsMd5,
        },
      );
    }
    // save file to database
    const size = fs.statSync(this.localPath()).size;
    await db
      .insert(systemFilesTable)
      .values({
        path: this.path(),
        extension: path.extname(this.path()),
        size,
        checksum: ourMd5,
        lastAccessed: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          size,
          checksum: ourMd5,
          lastAccessed: new Date(),
        },
      });
  }

  async read(): Promise<Buffer> {
    await this.download();
    await db
      .update(systemFilesTable)
      .set({ lastAccessed: new Date() })
      .where(eq(systemFilesTable.path, this.path()));
    return await fs.promises.readFile(this.localPath());
  }

  async download(): Promise<void> {
    if (!fs.existsSync(this.localPath())) {
      await readFromGoogleCloudStorage(this.path(), this.localPath());
    }
  }
}

async function fsWriteFile(filePath: string, content: Buffer): Promise<void> {
  return await new Promise((resolve, reject) => {
    fs.mkdir(path.dirname(filePath), { recursive: true }, (mkdirErr) => {
      if (mkdirErr) {
        reject(mkdirErr);
        return;
      }
      fs.writeFile(filePath, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

async function uploadGoogleCloudStorage(filePath: string, content: Uint8Array) {
  const bucket = getGoogleCloudStorageBucket();
  await bucket.file(filePath).save(content);
  const metadata = await bucket.file(filePath).getMetadata();
  return metadata[0].md5Hash;
}

async function readFromGoogleCloudStorage(
  filePath: string,
  fullPath: string,
): Promise<void> {
  const bucket = getGoogleCloudStorageBucket();
  const file = bucket.file(filePath);
  const [content] = await file.download();
  await fsWriteFile(fullPath, content);
}

function getGoogleCloudStorageBucket() {
  const settings = getGoogleCloudStorageSettings();
  const storage = new Storage({
    projectId: settings.projectId,
    credentials: {
      client_email: settings.credentials.clientEmail,
      private_key: settings.credentials.privateKey,
    },
  });
  return storage.bucket(settings.bucket);
}
