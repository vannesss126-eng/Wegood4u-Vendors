// Shared anchors + deterministic helpers for the multi-store mock engine.
//
// Every store's dataset is generated from these — all randomness is seeded so
// the same numbers come back on every render (no SSR/CSR hydration mismatch).
//
// The app is "live": the real current date is resolved on the client (see
// useLiveToday) and threaded into the generator, so visits, KPIs, billing and
// the calendar all track the actual current day. MOCK_TODAY below is only the
// deterministic first-render fallback before the real date resolves on mount.

export const MOCK_TODAY = "2026-05-27";

/* ------------------------------------------------------------ seeded RNG */

/** Linear-congruential PRNG. Stateful closure over a single integer seed. */
export function makeRand(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** FNV-1a-ish string hash → stable per-store seed base. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function weightedPick<T>(rand: () => number, table: Array<[T, number]>): T {
  const r = rand();
  let acc = 0;
  for (const [value, weight] of table) {
    acc += weight;
    if (r < acc) return value;
  }
  return table[table.length - 1][0];
}

/* ------------------------------------------------------------ date helpers */

export const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Days since Unix epoch for a YYYY-MM-DD string (UTC). Stable ordinal. */
export function dayOrdinal(dateStr: string): number {
  return Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / 86400000);
}

/** Monday-first weekday index (Mon=0 … Sun=6) for a YYYY-MM-DD string. */
export function mondayDow(dateStr: string): number {
  return (new Date(`${dateStr}T00:00:00Z`).getUTCDay() + 6) % 7;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Number of days in a month key (YYYY-MM). */
export function daysInMonthOf(mk: string): number {
  const [y, m] = mk.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Shift a month key (YYYY-MM) by `delta` months. */
export function addMonthKey(mk: string, delta: number): string {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

export const nextMonthKey = (mk: string) => addMonthKey(mk, 1);
export const prevMonthKey = (mk: string) => addMonthKey(mk, -1);

/** `n` most recent month options (value + label), newest first, ending at `currentMonth`. */
export function monthOptions(
  currentMonth: string,
  n: number
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const mk = addMonthKey(currentMonth, -i);
    const [y, m] = mk.split("-").map(Number);
    out.push({ value: mk, label: `${MONTH_NAMES_LONG[m - 1]} ${y}` });
  }
  return out;
}

/** All YYYY-MM-DD days in month `mk` (YYYY-MM) that fall within [from, to]. */
export function activeDaysInMonth(mk: string, from: string, to: string): string[] {
  const [y, m] = mk.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${pad2(m)}-${pad2(d)}`;
    if (dateStr >= from && dateStr <= to) out.push(dateStr);
  }
  return out;
}
