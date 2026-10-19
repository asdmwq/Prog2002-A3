/**
 * format.ts
 * Small presentation helpers shared by the admin dashboard.
 */

/** Format a number as yuan, e.g. 9200 -> "¥9,200.00". */
export function formatMoney(value: number | string | null | undefined): string {
  let n = Number(value);
  if (Number.isNaN(n)) n = 0;
  return '\u00A5' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format an ISO date as "18 Oct 2026" (matches the admin table). */
export function formatDateShort(iso?: string | null): string {
  if (!iso) return '–';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Root a relative image path so it resolves on any route. */
export function imageUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
  return '/' + url;
}
