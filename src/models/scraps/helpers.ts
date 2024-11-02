import { ScrapWithFiles } from "@/db/schema";

export function computePotentialProfit(scrap: ScrapWithFiles) {
  const total_custo_arrematacao =
    scrap.custo_arrematacao_comissao_leiloeiro_percentual *
      scrap.valor_arrematacao +
    scrap.custo_arrematacao_registro +
    scrap.custo_arrematacao_itbi_percentual * scrap.valor_arrematacao +
    scrap.custo_arrematacao_advogado;
  const total_custo_pos_imissao =
    scrap.custo_pos_imissao_reforma +
    scrap.custo_pos_imissao_divida_iptu +
    scrap.custo_pos_imissao_divida_condominio +
    scrap.custo_pos_imissao_outros;
  const total_custo_pos_arrematacao =
    scrap.custo_pos_arrematacao_prazo_de_venda_em_meses *
    (scrap.custo_pos_arrematacao_valor_iptu_mensal +
      scrap.custo_pos_arrematacao_valor_condominio_mensal);
  const total_custo_sem_imposto_venda =
    total_custo_arrematacao +
    total_custo_pos_imissao +
    total_custo_pos_arrematacao;
  const total_custo_pos_venda =
    scrap.custo_pos_venda_comissao_corretora_percentual * scrap.valor_venda +
    scrap.custo_pos_venda_imposto_ganho_capita_percentual *
      total_custo_sem_imposto_venda;
  const total_custo_sem_arrematacao =
    total_custo_arrematacao +
    total_custo_pos_imissao +
    total_custo_pos_arrematacao +
    total_custo_pos_venda;
  const total_custo = total_custo_sem_arrematacao + scrap.valor_arrematacao;
  const lucro = scrap.valor_venda - total_custo;
  const lucro_percentual = (lucro / scrap.valor_venda) * 100;
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
