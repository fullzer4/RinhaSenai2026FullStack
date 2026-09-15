// Formatação compartilhada entre as páginas - Rinha FullStack SENAI 2026
// (time: davidefreitas)

export function formatCurrency(cents) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format((cents ?? 0) / 100);
}

export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('pt-BR');
}

export const STATUS_LABELS = {
  approved: 'Aprovada',
  declined: 'Recusada',
  refunded: 'Estornada',
};

export const BRAND_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  elo: 'Elo',
};
