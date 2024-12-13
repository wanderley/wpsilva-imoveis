export function formatCurrency(
  value: number | null | undefined,
  message: string = "Valor não disponível",
) {
  if (!value) {
    return message;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
