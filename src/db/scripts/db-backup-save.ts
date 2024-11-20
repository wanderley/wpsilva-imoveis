import {
  ensureBackupDirExists,
  getDatabaseName,
  getDatabaseParams,
  getLatestBackupFilePath,
  getNextBackupFilePath,
} from "@/db/scripts/lib";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function main() {
  const params = getDatabaseParams();
  const dbName = getDatabaseName();
  const filePath = getNextBackupFilePath();
  const lastFilePath = getLatestBackupFilePath();

  await ensureBackupDirExists();

  try {
    console.log(`mysqldump ${params} ${dbName} > ${filePath}`);
    await execAsync(`mysqldump ${params} ${dbName} > ${filePath}`);
    console.log(`Backup saved to ${filePath}`);
  } catch (err) {
    console.error(
      `Failed to create database backup: ${(err as Error).message}`,
    );
    process.exit(1);
  }

  try {
    await execAsync(`rm -f ${lastFilePath}`);
    await execAsync(`ln -s ${filePath} ${lastFilePath}`);
    console.log(`Created link to latest backup file at ${lastFilePath}`);
  } catch (err) {
    console.error(
      `Failed to update latest backup link: ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

main().catch(console.error);
