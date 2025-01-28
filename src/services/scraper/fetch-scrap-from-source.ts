"use server";

import { db } from "@/db";
import {
  scrapAnalysesTable,
  scrapFilesTable,
  scrapProfitTable,
  scrapsTable,
  validatedAddressTable,
} from "@/db/schema";
import { findScrapByID } from "@/features/auction/scrap/repository";
import { SystemError } from "@/lib/error";
import { updateProfit } from "@/models/scraps/helpers";
import { formatTextAsMarkdown } from "@/services/ai/format-text-as-markdown";
import { updateAnalysis } from "@/services/analyser/actions";
import { SystemFilePath } from "@/services/file/system-file";
import { validateAddress } from "@/services/google/address-validation";
import { deriveTipoDireito } from "@/services/scraper/lib/derive-tipo-direito";
import { waitPageToBeReady } from "@/services/scraper/lib/puppeteer";
import { Lot, Scraper } from "@/services/scraper/scraper";
import { getScraper } from "@/services/scraper/scrapers";
import { and, count, eq, inArray } from "drizzle-orm";
import { Page } from "puppeteer";

import { deriveTipoImovel } from "./lib/derive-tipo-imovel";

export async function fetchScrapFromSource(
  scraperID: string,
  url: string,
  page: Page,
): Promise<void> {
  const scraper = getScraper(scraperID);
  if (!scraper) {
    throw new Error(`Scraper ${scraperID} not found`);
  }
  const previousScrap = await getScrap(scraperID, url);
  let scrapData: Lot | undefined = undefined;
  try {
    await login(scraper, page);
    await page.goto(url);
    await waitPageToBeReady(page);
    await waitUntilLoaded(scraper, page);
    scrapData = await scrapLink(scraper, page);
    await db
      .update(scrapsTable)
      .set({
        auction_status: scrapData.status,
        name: scrapData.name,
        fetch_status: fetchStatus(previousScrap, scrapData),
        address: scrapData.address,
        description: scrapData.description,
        description_markdown: await genDescriptionMarkdown(
          previousScrap.description ?? undefined,
          scrapData.description,
        ),
        case_number: scrapData.caseNumber,
        case_link: scrapData.caseLink,
        bid: scrapData.bid,
        appraisal: scrapData.appraisal,
        first_auction_date: scrapData.firstAuctionDate,
        first_auction_bid: scrapData.firstAuctionBid,
        second_auction_date: scrapData.secondAuctionDate,
        second_auction_bid: scrapData.secondAuctionBid,
        laudo_link: scrapData.laudoLink,
        laudo_file: await genLaudoFile(
          page,
          scraper,
          previousScrap,
          scrapData.laudoLink,
        ),
        matricula_link: scrapData.matriculaLink,
        matricula_file: await genMatriculaFile(
          page,
          scraper,
          previousScrap,
          scrapData.matriculaLink,
        ),
        edital_link: scrapData.editalLink,
        edital_file: await genEditalFile(
          page,
          scraper,
          previousScrap,
          scrapData.editalLink,
        ),
        analise_tipo_direito: await genTipoDireito(
          previousScrap,
          scrapData.description,
        ),
        analise_tipo_imovel: await genTipoImovel(
          previousScrap,
          scrapData.description,
        ),
      })
      .where(
        and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
      )
      .execute();

    await maybeUpdateImages(previousScrap.id, scrapData.images);
    await maybeValidateAndSaveAddress(scrapData.address);
    await maybeUpdateAnalysis(previousScrap.id);
    await maybeUpdateProfit(previousScrap.id);
  } catch (error) {
    await db
      .update(scrapsTable)
      .set({
        fetch_status: "failed",
      })
      .where(
        and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
      )
      .execute();
    throw new Error(`Failed to fetch scrap ${url}`, {
      cause: {
        originalError: error,
        metadata: {
          scrapId: previousScrap.id,
          scrapData,
        },
      },
    });
  }
}

async function scrapLink(scraper: Scraper, page: Page): Promise<Lot> {
  async function tryFetchField<T>(
    fieldName: string,
    field: (page: Page) => Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await field(page);
    } catch (error) {
      console.error(
        `Error fetching field ${fieldName}: ${(error as Error).message}`,
      );
      return undefined;
    }
  }
  const lot = {
    name: await tryFetchField("name", scraper.name),
    address: await tryFetchField("address", scraper.address),
    status: await tryFetchField("status", scraper.status),
    description: await tryFetchField("description", scraper.description),
    caseNumber: await tryFetchField("caseNumber", scraper.caseNumber),
    caseLink: await tryFetchField("caseLink", scraper.caseLink),
    bid: await tryFetchField("bid", scraper.bid),
    appraisal: await tryFetchField("appraisal", scraper.appraisal),
    firstAuctionDate: await tryFetchField(
      "firstAuctionDate",
      scraper.firstAuctionDate,
    ),
    firstAuctionBid: await tryFetchField(
      "firstAuctionBid",
      scraper.firstAuctionBid,
    ),
    secondAuctionDate: await tryFetchField(
      "secondAuctionDate",
      scraper.secondAuctionDate,
    ),
    secondAuctionBid: await tryFetchField(
      "secondAuctionBid",
      scraper.secondAuctionBid,
    ),
    images: (await tryFetchField("images", scraper.images)) || [],
    laudoLink: await tryFetchField("laudoLink", scraper.laudoLink),
    matriculaLink: await tryFetchField("matriculaLink", scraper.matriculaLink),
    editalLink: await tryFetchField("editalLink", scraper.editalLink),
  };
  if (lot.bid === undefined) {
    if (
      lot.firstAuctionBid !== undefined &&
      lot.firstAuctionDate !== undefined &&
      lot.firstAuctionDate >= new Date()
    ) {
      lot.bid = lot.firstAuctionBid;
    } else if (
      lot.secondAuctionBid !== undefined &&
      lot.secondAuctionDate !== undefined &&
      lot.secondAuctionDate >= new Date()
    ) {
      lot.bid = lot.secondAuctionBid || lot.firstAuctionBid;
    }
  }
  return lot;
}

type Scrap = Awaited<ReturnType<typeof getScrap>>;

async function getScrap(scraperID: string, url: string) {
  const scrap = await db.query.scrapsTable.findFirst({
    where: and(eq(scrapsTable.scraper_id, scraperID), eq(scrapsTable.url, url)),
  });
  if (!scrap) {
    throw new Error(`Scrap ${url} not found`);
  }
  return scrap;
}

// Update rotina-ajustar-fetch-status if this function changes
function fetchStatus(
  previousScrap: Scrap,
  scrapData: Lot,
): "fetched" | "failed" {
  const requiredFields = [
    scrapData.name || previousScrap.name,
    scrapData.address || previousScrap.address,
    scrapData.caseNumber || previousScrap.case_number,
    scrapData.editalLink || previousScrap.edital_link,
    scrapData.matriculaLink || previousScrap.matricula_link,
  ];
  if (requiredFields.some((field) => field == null)) {
    return "failed";
  }
  return "fetched";
}

async function maybeUpdateImages(
  scrapID: number,
  imageUrls: string[],
): Promise<void> {
  // don't update images if scraper failed to fetch them
  if (imageUrls.length === 0) {
    return;
  }

  const count = await db.$count(
    scrapFilesTable,
    and(
      eq(scrapFilesTable.scrap_id, scrapID),
      inArray(scrapFilesTable.url, imageUrls),
    ),
  );
  // don't update images if they are already in the database
  if (count === imageUrls.length) {
    return;
  }

  await db
    .delete(scrapFilesTable)
    .where(eq(scrapFilesTable.scrap_id, scrapID))
    .execute();
  await db
    .insert(scrapFilesTable)
    .values(
      imageUrls.map((imageUrl) => ({
        scrap_id: scrapID,
        file_type: "jpg" as const,
        url: imageUrl,
      })),
    )
    .execute();
}

async function maybeUpdateAnalysis(scrapID: number): Promise<void> {
  const { analysesCount } = (
    await db
      .select({ analysesCount: count() })
      .from(scrapAnalysesTable)
      .where(eq(scrapAnalysesTable.scrap_id, scrapID))
      .execute()
  )[0];
  // If no analysis exists, create one
  if (analysesCount === 0) {
    await updateAnalysis(
      scrapID,
      (process.env.SCRAPER_ANALYSER_MODEL_FOR_FIRST_FETCH as
        | "gpt-4o"
        | "gpt-4o-mini"
        | undefined) ?? "gpt-4o-mini",
    );
  }
}

async function maybeUpdateProfit(scrapID: number): Promise<void> {
  const scrap = await findScrapByID(scrapID);
  if (!scrap) {
    return;
  }
  let profit = await db.query.scrapProfitTable.findFirst({
    where: eq(scrapProfitTable.scrap_id, scrapID),
  });
  if (!profit) {
    await db.insert(scrapProfitTable).values({ scrap_id: scrapID }).execute();
    profit = (await db.query.scrapProfitTable.findFirst({
      where: eq(scrapProfitTable.scrap_id, scrapID),
    }))!;
  }

  let valorVenda = profit.valor_venda;
  if (profit.status === "default-values") {
    valorVenda = scrap.appraisal ?? profit.valor_venda;
  }
  profit = updateProfit({
    ...profit,
    valor_arrematacao: scrap.preferred_auction_bid ?? profit.valor_arrematacao,
    valor_venda: valorVenda,
  });

  await db
    .update(scrapProfitTable)
    .set(profit)
    .where(eq(scrapProfitTable.scrap_id, scrapID))
    .execute();
}

async function maybeValidateAndSaveAddress(
  address: string | undefined,
): Promise<void> {
  if (!address) return;

  // Check if address is already validated
  const existing = await db.query.validatedAddressTable.findFirst({
    where: eq(validatedAddressTable.original_address, address),
  });

  if (existing) {
    return;
  }

  const validatedAddress = await validateAddress(address);

  // Only save if we have all required fields
  if (
    !validatedAddress?.formatted_address ||
    !validatedAddress?.administrative_area_level_2 ||
    !validatedAddress?.administrative_area_level_1 ||
    !validatedAddress?.country ||
    !validatedAddress?.route ||
    !validatedAddress?.sublocality ||
    !validatedAddress?.postal_code ||
    validatedAddress?.latitude === undefined ||
    validatedAddress?.longitude === undefined
  ) {
    // Save as not_found if validation failed or missing required fields
    await db
      .insert(validatedAddressTable)
      .values({
        original_address: address,
        formatted_address: address, // Use original address as formatted
        administrative_area_level_2: "UNKNOWN",
        administrative_area_level_1: "UNKNOWN",
        country: "UNKNOWN",
        street_number: null,
        route: "UNKNOWN",
        sublocality: "UNKNOWN",
        subpremise: null,
        postal_code: "UNKNOWN",
        latitude: 0,
        longitude: 0,
        validation_status: "not_found",
      })
      .execute();
    return;
  }

  const addressData = {
    original_address: address,
    formatted_address: validatedAddress.formatted_address,
    street_number: validatedAddress.street_number || null,
    route: validatedAddress.route || "UNKNOWN",
    sublocality: validatedAddress.sublocality || "UNKNOWN",
    subpremise: validatedAddress.subpremise || null,
    administrative_area_level_2: validatedAddress.administrative_area_level_2,
    administrative_area_level_1: validatedAddress.administrative_area_level_1,
    country: validatedAddress.country,
    postal_code: validatedAddress.postal_code || "UNKNOWN",
    latitude: validatedAddress.latitude,
    longitude: validatedAddress.longitude,
    validation_status: "valid" as const,
  };

  await db.insert(validatedAddressTable).values(addressData).execute();
}

async function genLaudoFile(
  page: Page,
  scraper: Scraper,
  scrap: Scrap,
  laudoLink: string | undefined,
): Promise<string | undefined> {
  try {
    if (!laudoLink || (!!scrap.laudo_file && laudoLink === scrap.laudo_link)) {
      return scrap.laudo_file ?? undefined;
    }
    const laudoFile = SystemFilePath.scrapLaudo(scrap.scraper_id, scrap.url);
    await laudoFile.write(await scraper.fetch(page, laudoLink));
    return laudoFile.path();
  } catch (error) {
    throw new SystemError(`Não pode baixar o arquivo do laudo`, error, {
      scraperID: scrap.scraper_id,
      url: scrap.url,
      laudoLink,
    });
  }
}

async function genMatriculaFile(
  page: Page,
  scraper: Scraper,
  scrap: Scrap,
  matriculaLink: string | undefined,
): Promise<string | undefined> {
  try {
    if (
      !matriculaLink ||
      (!!scrap.matricula_file && matriculaLink === scrap.matricula_link)
    ) {
      return scrap.matricula_file ?? undefined;
    }
    const matriculaFile = SystemFilePath.scrapMatricula(
      scrap.scraper_id,
      scrap.url,
    );
    await matriculaFile.write(await scraper.fetch(page, matriculaLink));
    return matriculaFile.path();
  } catch (error) {
    throw new SystemError(`Não pode baixar o arquivo= do laudo`, error, {
      scraperID: scrap.scraper_id,
      url: scrap.url,
      matriculaLink,
    });
  }
}

async function genEditalFile(
  page: Page,
  scraper: Scraper,
  scrap: Scrap,
  editalLink: string | undefined,
): Promise<string | undefined> {
  try {
    if (
      !editalLink ||
      (!!scrap.edital_file && editalLink === scrap.edital_link)
    ) {
      return scrap.edital_file ?? undefined;
    }
    const editalFile = SystemFilePath.scrapEdital(scrap.scraper_id, scrap.url);
    await editalFile.write(await scraper.fetch(page, editalLink));
    return editalFile.path();
  } catch (error) {
    throw new SystemError(`Não pode baixar o arquivo= do laudo`, error, {
      scraperID: scrap.scraper_id,
      url: scrap.url,
      editalLink,
    });
  }
}
export async function genDescriptionMarkdown(
  oldDescription: string | undefined,
  newDescription: string | undefined,
): Promise<string | undefined> {
  if (newDescription == null || newDescription === oldDescription) {
    return newDescription;
  }
  return formatTextAsMarkdown(newDescription);
}

async function genTipoDireito(
  scrap: Scrap,
  newDescription: string | null | undefined,
): Promise<Scrap["analise_tipo_direito"] | undefined> {
  if (
    newDescription == null ||
    newDescription === scrap.description ||
    scrap.analise_tipo_direito_verificada === 1
  ) {
    return scrap.analise_tipo_direito;
  }
  const tipoDireito = await deriveTipoDireito(newDescription);
  if (tipoDireito == null) {
    console.error("Não pode derivar o tipo de direito", {
      scrapID: scrap.id,
      newDescription,
    });
    return null;
  }
  return tipoDireito;
}

async function genTipoImovel(
  scrap: Scrap,
  newDescription: string | null | undefined,
): Promise<Scrap["analise_tipo_imovel"] | undefined> {
  if (
    newDescription == null ||
    newDescription === scrap.description ||
    scrap.analise_tipo_imovel_verificada === 1
  ) {
    return scrap.analise_tipo_imovel;
  }
  return await deriveTipoImovel(newDescription);
}

async function login(scraper: Scraper, page: Page): Promise<void> {
  try {
    if (scraper.login) {
      await scraper.login(page);
    }
  } catch (error) {
    console.error(
      `[${scraper.url}] Error logging in: ${(error as Error).message}`,
    );
  }
}

async function waitUntilLoaded(scraper: Scraper, page: Page): Promise<void> {
  try {
    if (scraper.waitUntilLoaded) {
      await scraper.waitUntilLoaded(page);
    }
  } catch (error) {
    console.error(
      `[${scraper.url}] Error waiting for page to load: ${
        (error as Error).message
      }`,
    );
  }
}
