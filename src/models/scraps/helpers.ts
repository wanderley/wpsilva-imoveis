import { ScrapProfit } from "@/db/schema";

export function computeProfit(data: ScrapProfit) {
  const total_custo_arrematacao =
    data.custo_arrematacao_comissao_leiloeiro_percentual *
      data.valor_arrematacao +
    data.custo_arrematacao_registro +
    data.custo_arrematacao_itbi_percentual * data.valor_arrematacao +
    data.custo_arrematacao_advogado;
  const total_custo_pos_imissao =
    data.custo_pos_imissao_reforma +
    data.custo_pos_imissao_divida_iptu +
    data.custo_pos_imissao_divida_condominio +
    data.custo_pos_imissao_outros;
  const total_custo_pos_arrematacao =
    data.custo_pos_arrematacao_prazo_de_venda_em_meses *
    (data.custo_pos_arrematacao_valor_iptu_mensal +
      data.custo_pos_arrematacao_valor_condominio_mensal);
  const total_custo_sem_imposto_venda =
    total_custo_arrematacao +
    total_custo_pos_imissao +
    total_custo_pos_arrematacao;
  const total_custo_pos_venda =
    data.custo_pos_venda_comissao_corretora_percentual * data.valor_venda +
    data.custo_pos_venda_imposto_ganho_capita_percentual *
      total_custo_sem_imposto_venda;
  const total_custo_sem_arrematacao =
    total_custo_arrematacao +
    total_custo_pos_imissao +
    total_custo_pos_arrematacao +
    total_custo_pos_venda;
  const total_custo = total_custo_sem_arrematacao + data.valor_arrematacao;
  const lucro = data.valor_venda - total_custo;
  const lucro_percentual = (lucro / data.valor_venda) * 100;
  const total_custo_arrematacao_percentual =
    (total_custo_arrematacao / total_custo_sem_arrematacao) * 100;
  const total_custo_pos_imissao_percentual =
    (total_custo_pos_imissao / total_custo_sem_arrematacao) * 100;
  const total_custo_pos_arrematacao_percentual =
    (total_custo_pos_arrematacao / total_custo_sem_arrematacao) * 100;
  const total_custo_pos_venda_percentual =
    (total_custo_pos_venda / total_custo_sem_arrematacao) * 100;

  return {
    lucro,
    lucro_percentual,
    total_custo_arrematacao_percentual,
    total_custo_arrematacao,
    total_custo_pos_arrematacao_percentual,
    total_custo_pos_arrematacao,
    total_custo_pos_imissao_percentual,
    total_custo_pos_imissao,
    total_custo_pos_venda_percentual,
    total_custo_pos_venda,
    total_custo_sem_imposto_venda,
  };
}

export function updateProfit(profit: ScrapProfit): ScrapProfit {
  const { lucro, lucro_percentual } = computeProfit(profit);
  return {
    ...profit,
    lucro,
    lucro_percentual,
  };
}
