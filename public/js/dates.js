// Pure date helpers. Event dates are stored as local 'YYYY-MM-DD' strings.

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MS_PER_DAY = 86_400_000;

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function parseISODate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// A real calendar date as 'YYYY-MM-DD' with a four-digit year from 1000 (rules expect this shape).
export function isValidISODate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || dateStr < '1000') return false;
  return toISODate(parseISODate(dateStr)) === dateStr;
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${ordinal(d)}, ${y}`;
}

export function daysDiff(dateStr, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Round to absorb DST hour shifts.
  return Math.round((parseISODate(dateStr) - today) / MS_PER_DAY);
}

export function buildCountdown(dateStr, now = new Date()) {
  const diff = daysDiff(dateStr, now);
  if (diff < 0) {
    const n = Math.abs(diff);
    return { num: n, unit: n === 1 ? 'day ago' : 'days ago' };
  }
  if (diff === 0) {
    return { num: '—', unit: 'today' };
  }
  if (diff <= 14) {
    return { num: diff, unit: diff === 1 ? 'day' : 'days' };
  }
  if (diff <= 89) {
    const w = Math.floor(diff / 7);
    const r = diff % 7;
    const weeks = w === 1 ? 'week' : 'weeks';
    if (r === 0) return { num: w, unit: weeks };
    return { num: w, unit: `${weeks} + ${r} ${r === 1 ? 'day' : 'days'}` };
  }
  if (diff < 365) {
    const mo = Math.round(diff / 30.44);
    return { num: mo, unit: mo === 1 ? 'month' : 'months' };
  }
  const yr = (diff / 365.25).toFixed(1);
  return { num: yr, unit: +yr === 1 ? 'year' : 'years' };
}

// Upcoming events first (soonest first), then past events (most recent first).
export function sortEvents(events, now = new Date()) {
  return [...events].sort((a, b) => {
    const da = daysDiff(a.date, now);
    const db = daysDiff(b.date, now);
    if (da >= 0 && db >= 0) return da - db;
    if (da < 0 && db < 0) return db - da;
    return da >= 0 ? -1 : 1;
  });
}
