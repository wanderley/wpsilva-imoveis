import {
  ensureBackupDirExists,
  getDatabaseName,
  getDatabaseParams,
  getLatestBackupFilePath,
} from "@/db/scripts/lib";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

async function main() {
  await ensureBackupDirExists();

  const params = getDatabaseParams();
  const dbName = getDatabaseName();
  const filePath = getLatestBackupFilePath();

  await execAsync(`mysql ${params} -e "DROP DATABASE IF EXISTS ${dbName};"`);
  console.log(`Dropped existing database ${dbName}`);

  await execAsync(`mysql ${params} -e "CREATE DATABASE ${dbName};"`);
  console.log(`Created database ${dbName}`);

  await execAsync(`mysql ${params} ${dbName} < ${filePath}`);
  console.log(`Backup restored from ${filePath}`);
}

main().catch(console.error);
