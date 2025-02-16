import { db } from "@/db";
import { ScrapProfit } from "@/db/schema";
import { mapAsync } from "@/lib/promise";
import { computeProfit } from "@/models/scraps/helpers";
import { selectedScrapsForManualReview } from "@/selected-scraps";
import { extrairAlienacaoFiduciaria } from "@/services/scraper/analises/extrair-alienacao-fiduciaria";
import { extrairDebitoExequendo } from "@/services/scraper/analises/extrair-debito-exequendo";
import { extrairDebitoOutros } from "@/services/scraper/analises/extrair-debito-outros";
import { extrairHipoteca } from "@/services/scraper/analises/extrair-hipoteca";
import { extrairPorcentagemTitularidade } from "@/services/scraper/analises/extrair-porcentagem-titularidade";
import { extrairTipoDireito } from "@/services/scraper/analises/extrair-tipo-direito";
import { extrairTipoExecucao } from "@/services/scraper/analises/extrair-tipo-execucao";
import { extrairTipoImovel } from "@/services/scraper/analises/extrair-tipo-imovel";
import {
  gerarContextoEdital,
  gerarContextoMatricula,
} from "@/services/scraper/analises/gerar-contexto";
import deepEqual from "deep-equal";
import { diffString } from "json-diff";

const knownProblemsCanBeIgnored: Record<
  number,
  { keys: string[]; reason: string }
> = {
  863: {
    keys: ["analise_alienacao_fiduciaria"],
    reason:
      "A linha que contém o débito fiduciário não aparece na conversão do edital para texto.",
  },
  865: {
    keys: ["analise_debito_exequendo"],
    reason:
      "A linha que contém o débito exequendo não aparece na conversão do edital para texto.",
  },
};

const focusScrapIds: number[] = [];

type Analise = {
  analise_tipo_imovel: string | null;
  analise_tipo_direito: string | null;
  analise_tipo_execucao: string | null;
  analise_hipoteca: {
    ativo: boolean;
    valor: number;
  } | null;
  analise_alienacao_fiduciaria: {
    ativo: boolean;
    valor: number;
  } | null;
  analise_debito_exequendo: {
    despesa_condominio: boolean;
    debito_exequendo: number;
  } | null;
  analise_debito_outros: {
    outros: number;
    condominio: number;
  } | null;
};

export async function benchmark() {
  const scraps = await db.query.scrapsTable.findMany({
    where: (table, { and, eq, or, inArray, isNotNull, notInArray }) =>
      and(
        inArray(
          table.id,
          focusScrapIds.length > 0
            ? focusScrapIds
            : selectedScrapsForManualReview,
        ),
        isNotNull(table.edital_file),
        isNotNull(table.matricula_file),
        or(
          eq(table.analise_hipoteca_verificada, 0),
          eq(table.analise_alienacao_fiduciaria_verificada, 0),
          eq(table.analise_debito_exequendo_verificada, 0),
          eq(table.analise_resumo_matricula_verificada, 0),
        ),
        notInArray(table.id, [143, 120, 121, 201]),
      ),
    orderBy: (table, { asc }) => [asc(table.id)],
  });
  const resultados = await mapAsync(
    scraps,
    async (scrap) => {
      try {
        const [contextoEdital, contextoMatricula] = await Promise.all([
          gerarContextoEdital(scrap.edital_file!),
          gerarContextoMatricula(scrap.matricula_file!),
        ]);
        const tipoExecucao = await extrairTipoExecucao(contextoEdital);
        const debitoExequendo = await extrairDebitoExequendo(contextoEdital);
        return {
          id: scrap.id,
          scrap,
          actual: {
            analise_tipo_imovel: scrap.analise_tipo_imovel,
            analise_tipo_direito: scrap.analise_tipo_direito,
            analise_porcentagem_titularidade:
              scrap.analise_porcentagem_titularidade,
            analise_tipo_execucao: scrap.analise_tipo_execucao,
            analise_hipoteca: {
              ...scrap.analise_hipoteca,
              justificativa: undefined,
            },
            analise_alienacao_fiduciaria: {
              ...scrap.analise_alienacao_fiduciaria,
              justificativa: undefined,
            },
            analise_debito_exequendo: {
              ...scrap.analise_debito_exequendo,
              justificativa: undefined,
            },
            analise_debito_outros: {
              ...scrap.analise_debito_outros,
            },
          },
          new: {
            analise_tipo_imovel: await extrairTipoImovel(scrap.description!),
            analise_tipo_direito: await extrairTipoDireito(scrap.description!),
            analise_tipo_execucao: tipoExecucao,
            analise_porcentagem_titularidade: Math.round(
              await extrairPorcentagemTitularidade(scrap.description!),
            ),
            analise_hipoteca: {
              ...(await extrairHipoteca(contextoEdital, contextoMatricula)),
              justificativa: undefined,
            },
            analise_alienacao_fiduciaria: {
              ...(await extrairAlienacaoFiduciaria(
                contextoEdital,
                contextoMatricula,
              )),
              justificativa: undefined,
            },
            analise_debito_exequendo: {
              ...debitoExequendo,
              justificativa: undefined,
            },
            analise_debito_outros: {
              ...(await extrairDebitoOutros(
                contextoEdital,
                tipoExecucao,
                debitoExequendo,
              )),
            },
          },
        };
      } catch (_error) {
        console.error("Scrap", scrap.id);
        console.error(_error);
        return null;
      }
    },
    { workers: 100 },
  );

  const counters: Record<
    | "analise_tipo_imovel"
    | "analise_tipo_direito"
    | "analise_porcentagem_titularidade"
    | "analise_tipo_execucao"
    | "analise_hipoteca"
    | "analise_alienacao_fiduciaria"
    | "analise_debito_exequendo"
    | "analise_debito_outros",
    { correct: number; total: number; scrap_ids: number[] }
  > = {
    analise_tipo_imovel: { correct: 0, total: 0, scrap_ids: [] },
    analise_tipo_direito: { correct: 0, total: 0, scrap_ids: [] },
    analise_porcentagem_titularidade: { correct: 0, total: 0, scrap_ids: [] },
    analise_tipo_execucao: { correct: 0, total: 0, scrap_ids: [] },
    analise_hipoteca: { correct: 0, total: 0, scrap_ids: [] },
    analise_alienacao_fiduciaria: { correct: 0, total: 0, scrap_ids: [] },
    analise_debito_exequendo: { correct: 0, total: 0, scrap_ids: [] },
    analise_debito_outros: { correct: 0, total: 0, scrap_ids: [] },
  };
  for (const resultado of resultados) {
    if (!resultado) continue;
    if (!deepEqual(resultado.actual, resultado.new)) {
      console.log(
        "Scrap",
        resultado.id,
        `https://wpsilva-imoveis-production.up.railway.app/lot/${resultado.id}/review`,
        diffString(resultado.actual, resultado.new, { color: false }),
      );
      if (knownProblemsCanBeIgnored[resultado.id]) {
        console.log(
          "Ignorado:",
          knownProblemsCanBeIgnored[resultado.id].keys.join(", "),
        );
        console.log("Motivo:", knownProblemsCanBeIgnored[resultado.id].reason);
        console.log("\n");
      }
    }
    for (const key in counters) {
      if (
        deepEqual(
          resultado.new[key as keyof typeof resultado.new],
          resultado.actual[key as keyof typeof resultado.actual],
        )
      ) {
        counters[key as keyof typeof counters].correct++;
      } else if (!knownProblemsCanBeIgnored[resultado.id]?.keys.includes(key)) {
        counters[key as keyof typeof counters].scrap_ids.push(resultado.id);
      }
      if (!knownProblemsCanBeIgnored[resultado.id]?.keys.includes(key)) {
        counters[key as keyof typeof counters].total++;
      }
    }
  }
  for (const key in counters) {
    console.log(
      key.padEnd(35, "."),
      Number(
        (counters[key as keyof typeof counters].correct /
          counters[key as keyof typeof counters].total) *
          100,
      )
        .toFixed(2)
        .padStart(6),
      counters[key as keyof typeof counters].correct.toString().padStart(3),
      "/",
      counters[key as keyof typeof counters].total.toString().padEnd(3),
      counters[key as keyof typeof counters].scrap_ids.length > 0
        ? `(${counters[key as keyof typeof counters].scrap_ids.join(", ")})`
        : "",
    );
  }
  console.log("\n\n");
  console.log(
    "".padEnd(11),
    "Current profit".padStart(14),
    "New profit".padStart(15),
    "Cur %".padStart(6),
    "New %".padStart(6),
  );
  let oldOpportunities = 0;
  let newOpportunities = 0;
  for (const resultado of resultados) {
    if (!resultado) continue;
    const profit = await db.query.scrapProfitTable.findFirst({
      where: (table, { eq }) => eq(table.scrap_id, resultado.id),
    });
    if (!profit || profit.lucro_percentual < 30) {
      continue;
    }
    const newProfit = calculateNewProfit(profit, resultado.new as Analise);
    console.log(
      "Scrap",
      resultado.id.toString().padStart(4),
      Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
        .format(profit.lucro)
        .padStart(15),
      Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
        .format(newProfit.lucro)
        .padStart(15),
      Number(profit.lucro_percentual).toFixed(2).padStart(6),
      Number(newProfit.lucro_percentual).toFixed(2).padStart(6),
      resultado.scrap.auction_status?.padEnd(10),
      `https://wpsilva-imoveis-production.up.railway.app/lot/${resultado.id}/review`,
    );
    if (profit.lucro_percentual >= 30) {
      oldOpportunities++;
    }
    if (newProfit.lucro_percentual >= 30) {
      newOpportunities++;
    }
  }
  console.log({ oldOpportunities, newOpportunities });
}

function calculateNewProfit(profit: ScrapProfit, analise: Analise) {
  const valorCondominio = analise.analise_debito_exequendo?.despesa_condominio
    ? analise.analise_debito_exequendo.debito_exequendo
    : analise.analise_debito_outros?.condominio || 0;

  let saldoArrematacao = profit.valor_arrematacao;
  let dividaCondominio = 0;

  if (saldoArrematacao > valorCondominio) {
    saldoArrematacao -= valorCondominio;
  } else {
    dividaCondominio = valorCondominio - saldoArrematacao;
    saldoArrematacao = 0;
  }

  let outros = analise.analise_debito_outros?.outros || 0;
  if (
    analise.analise_alienacao_fiduciaria?.ativo &&
    analise.analise_alienacao_fiduciaria.valor &&
    analise.analise_tipo_execucao !==
      "Leilão Extrajudicial (Alienação Fiduciária)"
  ) {
    if (saldoArrematacao > analise.analise_alienacao_fiduciaria.valor) {
      saldoArrematacao -= analise.analise_alienacao_fiduciaria.valor;
    } else {
      outros += analise.analise_alienacao_fiduciaria.valor - saldoArrematacao;
      saldoArrematacao = 0;
    }
  }
  if (
    analise.analise_hipoteca?.ativo &&
    analise.analise_hipoteca.valor &&
    analise.analise_tipo_execucao !== "Execução Hipotecária"
  ) {
    if (saldoArrematacao > analise.analise_hipoteca.valor) {
      saldoArrematacao -= analise.analise_hipoteca.valor;
    } else {
      outros += analise.analise_hipoteca.valor - saldoArrematacao;
      saldoArrematacao = 0;
    }
  }
  const newProfitValues = {
    custo_arrematacao_comissao_leiloeiro_percentual: 0.05,
    custo_pos_imissao_divida_condominio: dividaCondominio,
    custo_pos_imissao_outros: outros,
  };
  return computeProfit({
    ...profit,
    ...newProfitValues,
  });
}
