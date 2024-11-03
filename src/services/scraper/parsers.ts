import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export function realToNumber(
  real: string | null | undefined,
): number | undefined {
  if (real == null) {
    return undefined;
  }
  const normalized = real
    .replace("R$", "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const ret = Number(normalized);
  if (isNaN(ret)) {
    throw new Error(`Invalid number in ${real} (${normalized})`);
  }
  return ret;
}

export const parseBrazilianDate = (
  dateString: string | null | undefined,
  formatDate: string,
) => {
  try {
    if (!dateString) return undefined;
    const parsedDate = parse(dateString, formatDate, new Date());
    return fromZonedTime(parsedDate, "America/Sao_Paulo");
  } catch (e) {
    throw new Error(`Invalid date in ${dateString} (${formatDate})`, {
      cause: e,
    });
  }
};
