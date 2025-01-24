import { Page } from "puppeteer";

export async function fetchFromPageContext(
  page: Page,
  url: string,
): Promise<Buffer> {
  const encoded = await page.evaluate(async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const u8a = new Uint8Array(buffer);
    const CHUNK_SZ = 0x8000;
    const chunks = [];
    for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
      chunks.push(
        String.fromCharCode.apply(
          null,
          u8a.subarray(i, i + CHUNK_SZ) as unknown as number[],
        ),
      );
    }
    return btoa(chunks.join(""));
  }, url);

  return Buffer.from(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
}

export async function regularFetch(_page: Page, url: string): Promise<Buffer> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}
