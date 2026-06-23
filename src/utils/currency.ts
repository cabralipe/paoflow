/**
 * Formata um número como moeda brasileira (Real - R$)
 * Exemplo: 8 -> R$ 8,00
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
