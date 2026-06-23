/**
 * Calcula o custo total e arredonda para 2 casas decimais de forma segura.
 * total = quantity * unitPrice
 */
export function calculateTotal(quantity: number, unitPrice: number): number {
  if (isNaN(quantity) || isNaN(unitPrice)) return 0;
  const raw = quantity * unitPrice;
  return Math.round((raw + Number.EPSILON) * 100) / 100;
}
