import { promises as fsPromises } from "node:fs";
import path from "node:path";

function getConfig() {
  const requiredEnvVars = [
    "BACKUP_DIR",
    "DB_USER",
    "DB_PASSWORD",
    "DB_PORT",
    "DB_NAME",
    "DB_HOST",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );
  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
    process.exit(1);
  }

  return {
    DB_BACKUP_DIR: process.env.DB_BACKUP_DIR as string,
    DB_USER: process.env.DB_USER as string,
    DB_PASSWORD: process.env.DB_PASSWORD as string,
    DB_PORT: process.env.DB_PORT as string,
    DB_NAME: process.env.DB_NAME as string,
    DB_HOST: process.env.DB_HOST as string,
  };
}

export function getLatestBackupFilePath() {
  const { DB_BACKUP_DIR } = getConfig();
  return path.join(DB_BACKUP_DIR, "latest.sql");
}

export function getNextBackupFilePath() {
  const { DB_NAME, DB_BACKUP_DIR } = getConfig();
  const srcDir = DB_BACKUP_DIR;
  const fileName = `${DB_NAME}-${new Date().toISOString().split("T")[0]}.sql`;
  return path.join(srcDir, fileName);
}

export async function ensureBackupDirExists() {
  const { DB_BACKUP_DIR } = getConfig();
  try {
    await fsPromises.mkdir(DB_BACKUP_DIR, { recursive: true });
  } catch (err) {
    console.error(
      `Failed to create backup directory: ${(err as Error).message}`,
    );
    process.exit(1);
  }
}

export function getDatabaseParams() {
  const { DB_USER, DB_PASSWORD, DB_PORT, DB_HOST } = getConfig();
  return `-u ${DB_USER} -p${DB_PASSWORD} -P ${DB_PORT} -h ${DB_HOST}`;
}

export function getDatabaseName() {
  const { DB_NAME } = getConfig();
  return DB_NAME;
}
