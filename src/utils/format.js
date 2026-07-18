const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const numberFormatter = new Intl.NumberFormat('en-US');

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;

  const n = typeof value === 'object' && value.$numberDecimal !== undefined ? Number(value.$numberDecimal) : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function formatCurrency(amount) {
  const n = toNumber(amount);
  return currencyFormatter.format(n ?? 0);
}

export function formatNumber(value) {
  const n = toNumber(value);
  return n === null ? '-' : numberFormatter.format(n);
}

export function formatPercent(value, digits = 1) {
  const n = toNumber(value);
  return n === null ? '-' : `${n.toFixed(digits)}%`;
}

export function formatMinutes(value) {
  const n = toNumber(value);
  if (n === null) return '-';
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function formatDateShort(value) {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDelta(value, digits = 1) {
  const n = toNumber(value);
  if (n === null) return { text: '-', tone: 'neutral' };
  const sign = n > 0 ? '+' : '';
  return { text: `${sign}${n.toFixed(digits)}%`, tone: n > 0 ? 'up' : n < 0 ? 'down' : 'neutral' };
}

const SEVERITY_TONE = { info: 'info', warning: 'warning', error: 'danger', critical: 'danger' };
export const severityTone = (s) => SEVERITY_TONE[String(s || '').toLowerCase()] || 'neutral';

const STATUS_TONE = {
  completed: 'success', complete: 'success', active: 'success', ok: 'success', closed: 'success', paid: 'success',
  pending: 'warning', variance: 'warning', partial: 'warning', suspended: 'warning',
  cancelled: 'danger', void: 'danger', missed: 'danger', error: 'danger', churned: 'danger',
  unmapped: 'warning', unassigned: 'neutral', inactive: 'neutral', unknown: 'neutral',
};
export const statusTone = (s) => STATUS_TONE[String(s || '').toLowerCase()] || 'neutral';
