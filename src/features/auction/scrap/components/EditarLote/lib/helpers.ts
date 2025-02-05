export function formatNumber(value: string) {
  return Number(Number(value).toFixed(2));
}

export function normalizeEmptyObject<T extends Record<string, unknown>>(
  obj: T | null | undefined,
) {
  if (obj == null) {
    return null;
  }
  return Object.values(obj).some((value) => value !== undefined) ? obj : null;
}
