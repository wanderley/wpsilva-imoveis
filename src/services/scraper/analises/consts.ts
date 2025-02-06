export const tipoExecucaoEnum = [
  "Execução Hipotecária",
  "Cobrança de Despesas Condominiais",
  "Execução Trabalhista",
  "Leilão Extrajudicial (Alienação Fiduciária)",
  "Outras Execuções",
] as const;
export type TipoExecucao = (typeof tipoExecucaoEnum)[number];
