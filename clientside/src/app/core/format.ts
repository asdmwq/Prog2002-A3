/**
 * format.ts
 * Pure presentation helpers shared by every component:
 *   - money and date formatting
 *   - today's date as YYYY-MM-DD
 *   - resolving a (possibly relative) image URL
 * Angular interpolation already escapes text, so no manual escaping is needed.
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

/** Format an ISO date (YYYY-MM-DD) as "Sun, 18 Oct 2026". */
export function formatDateLong(iso?: string | null): string {
  if (!iso) return '';
  const datePart = String(iso).slice(0, 10);
  const d = new Date(datePart + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return datePart;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Today's date in the browser's local time, YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Resolve a stored image URL. The database stores relative banner paths such
 * as "images/fun-run.svg"; under Angular's client-side router they must be
 * rooted at "/" so they resolve on every route.
 */
export function imageUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url;
  return '/' + url;
}

/** Privacy-friendly display: first name + last initial, e.g. "Mei L." */
export function displayName(firstName?: string, lastName?: string): string {
  const first = firstName || '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() + '.' : '';
  return (first + (lastInitial ? ' ' + lastInitial : '')).trim();
}
