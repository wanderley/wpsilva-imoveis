import { SystemError } from "@/lib/error";

export function getProcessoJudicialTjspSettings() {
  return {
    login: getEnvOrThrow("PROCESSO_JUDICIAL_TJSP_LOGIN"),
    password: getEnvOrThrow("PROCESSO_JUDICIAL_TJSP_PASSWORD"),
  };
}

/**
 * Google Cloud Storage settings
 * - Service account: https://console.cloud.google.com/iam-admin/serviceaccounts/details/112104298973787314226?hl=en&project=wp-silva-imoveis
 * - How to generate service account key: https://stackoverflow.com/a/74776285
 */
export function getGoogleCloudStorageSettings() {
  return {
    projectId: getEnvOrThrow("GOOGLE_CLOUD_STORAGE_PROJECT_ID"),
    bucket: getEnvOrThrow("GOOGLE_CLOUD_STORAGE_BUCKET"),
    credentials: {
      clientEmail: getEnvOrThrow("GOOGLE_CLOUD_STORAGE_CLIENT_EMAIL"),
      privateKey: getEnvOrThrow("GOOGLE_CLOUD_STORAGE_PRIVATE_KEY"),
    },
  };
}

export function getFilesPath() {
  return getEnvOrThrow("FILES_PATH");
}

function getEnvOrThrow(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new SystemError(`Environment variable ${key} is not set`);
  }
  return value;
}
