import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { Page } from "puppeteer";

type Extractor<T> = (page: Page) => Promise<T | undefined>;
export function pipe<T1, T2>(
  extractor: Extractor<T1>,
  fn1: (value: T1) => T2 | undefined,
): Extractor<T2>;
export function pipe<T1, T2, T3>(
  extractor: Extractor<T1>,
  fn1: (value: T1) => T2 | undefined,
  fn2: (value: T2) => T3 | undefined,
): Extractor<T3>;
export function pipe<T1, T2, T3, T4>(
  extractor: Extractor<T1>,
  fn1: (value: T1) => T2 | undefined,
  fn2: (value: T2) => T3 | undefined,
  fn3: (value: T3) => T4 | undefined,
): Extractor<T4>;
export function pipe<T1, T2, T3, T4, T5>(
  extractor: Extractor<T1>,
  fn1: (value: T1) => T2 | undefined,
  fn2: (value: T2) => T3 | undefined,
  fn3: (value: T3) => T4 | undefined,
  fn4: (value: T4) => T5 | undefined,
): Extractor<T5>;
export function pipe<T1, T2, T3, T4, T5>(
  extractor: Extractor<T1>,
  fn1: (value: T1) => T2 | undefined,
  fn2?: (value: T2) => T3 | undefined,
  fn3?: (value: T3) => T4 | undefined,
  fn4?: (value: T4) => T5 | undefined,
): Extractor<T2 | T3 | T4 | T5> {
  return async (page: Page) => {
    const res = await extractor(page);
    if (res === undefined) {
      return undefined;
    }
    const firstResult = fn1(res);
    if (!fn2) {
      return firstResult;
    }
    if (firstResult === undefined) {
      return undefined;
    }
    const secondResult = fn2(firstResult);
    if (secondResult === undefined) {
      return undefined;
    }
    if (!fn3) {
      return secondResult;
    }
    const thirdResult = fn3(secondResult);
    if (thirdResult === undefined) {
      return undefined;
    }
    if (!fn4) {
      return thirdResult;
    }
    return fn4(thirdResult);
  };
}

export function or<T>(...extractors: Extractor<T>[]): Extractor<T> {
  return async (page: Page) => {
    for (const extractor of extractors) {
      const res = await extractor(page);
      if (res !== undefined) {
        return res;
      }
    }
    return undefined;
  };
}

export function getTextFromSelector(selector: string): Extractor<string> {
  return async (page: Page) =>
    (await page.evaluate(
      (selector) => document.querySelector(selector)?.textContent,
      selector,
    )) ?? undefined;
}

type IncludesFinder = { type: "finder"; name: "includes"; text: string };
type AttributeIncludesFinder = {
  type: "finder";
  name: "attribute";
  attribute: string;
  text: string;
};
type Finder = IncludesFinder | AttributeIncludesFinder;

export function IncludesFinder(text: string): IncludesFinder {
  return { type: "finder", name: "includes", text };
}

export function AttributeIncludesFinder(
  attribute: string,
  text: string,
): AttributeIncludesFinder {
  return { type: "finder", name: "attribute", attribute, text };
}

type TextContentGetter = { type: "getter"; name: "textContent" };
type AttributeGetter = { type: "getter"; name: "attribute"; attribute: string };
type Getter = TextContentGetter | AttributeGetter;

export function ReturnText(): TextContentGetter {
  return { type: "getter", name: "textContent" };
}

export function ReturnAttribute(attribute: string): AttributeGetter {
  return { type: "getter", name: "attribute", attribute };
}

type NoFilters = { type: "filter"; name: "none" };
type IncludesFilter = { type: "filter"; name: "includes"; text: string };
type AttributeIncludesFilter = {
  type: "filter";
  name: "attribute";
  attribute: string;
  text: string;
};
type Filter = NoFilters | IncludesFilter | AttributeIncludesFilter;

export function NoFilters(): NoFilters {
  return { type: "filter", name: "none" };
}

export function IncludesFilter(text: string): IncludesFilter {
  return { type: "filter", name: "includes", text };
}

export function AttributeIncludesFilter(
  attribute: string,
  text: string,
): AttributeIncludesFilter {
  return { type: "filter", name: "attribute", attribute, text };
}

export function getFromSelector(
  selector: string,
  find: Finder,
  get: Getter,
): (page: Page) => Promise<string | undefined> {
  return async (page) =>
    await page.evaluate(
      (selector, find, get) => {
        const elem = Array.from(document.querySelectorAll(selector)).find(
          (elem) => {
            switch (find.name) {
              case "includes":
                return elem.textContent?.includes(find.text);
              case "attribute":
                return elem.getAttribute(find.attribute)?.includes(find.text);
            }
          },
        );
        if (elem === undefined) {
          return undefined;
        }
        switch (get.name) {
          case "textContent":
            return elem.textContent ?? undefined;
          case "attribute":
            return elem.getAttribute(get.attribute) ?? undefined;
        }
      },
      selector,
      find,
      get,
    );
}

export function getFromSelectorAll(
  selector: string,
  filter: Filter,
  get: Getter,
): (page: Page) => Promise<string[]> {
  return async (page) =>
    await page.evaluate(
      (selector, filter, get) => {
        const elems = Array.from(document.querySelectorAll(selector)).filter(
          (elem) => {
            switch (filter.name) {
              case "none":
                return true;
              case "includes":
                return elem.textContent?.includes(filter.text);
              case "attribute":
                return elem
                  .getAttribute(filter.attribute)
                  ?.includes(filter.text);
            }
          },
        );
        return elems
          .map((elem) => {
            switch (get.name) {
              case "textContent":
                return elem.textContent ?? undefined;
              case "attribute":
                return elem.getAttribute(get.attribute) ?? undefined;
            }
          })
          .filter((value): value is string => value !== undefined);
      },
      selector,
      filter,
      get,
    );
}

export function getNumberFromReais(
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

export function getBrazilianDate(formatDate: string) {
  return (value: string | undefined) =>
    value === undefined ? undefined : parseBrazilianDate(value, formatDate);
}

export function removeUnnecessarySpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function matchCaseNumber(prefix: string): (text: string) => string {
  return (text: string) =>
    text.match(
      new RegExp(
        `${prefix}\\s*(\\d{7}-\\\d{2}\\\.\\d{4}\\\.\\d\\\.\\d{2}\\\.\\d{4})`,
      ),
    )![1];
}

export function matchText(
  pattern: RegExp,
  fn?: (match: string, ...args: string[]) => string,
): (text: string) => string | undefined {
  return (text: string) => {
    const match = text.match(pattern);
    if (match === null) {
      return undefined;
    }
    if (fn === undefined) {
      return match[0];
    }
    return fn(match[0], ...match.slice(1));
  };
}

export function replaceText(
  pattern: string,
  replacement: string,
): (text: string) => string;
export function replaceText(
  pattern: RegExp,
  replacement: (match: string, ...args: string[]) => string,
): (text: string) => string;
export function replaceText(
  pattern: string | RegExp,
  replacement: string | ((match: string, ...args: string[]) => string),
): (text: string) => string {
  return (text: string) => {
    if (typeof replacement === "string") {
      return text.replace(pattern, replacement);
    } else {
      return text.replace(pattern, replacement);
    }
  };
}
