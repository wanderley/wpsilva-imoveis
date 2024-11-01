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

export const parseBrazilianDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const parsedDate = parse(dateString, "dd/MM/yyyy HH:mm", new Date());
  return fromZonedTime(parsedDate, "America/Sao_Paulo");
};
