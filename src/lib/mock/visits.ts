// Deterministic visit generator for Thai Geng Mookata.
//
// Spans the enrollment window (2026-02-12) → today (2026-05-27).
// All randomness is seeded so the same dataset comes back on every render
// (no SSR/CSR hydration mismatches, no flaky tests).
//
// In Pass 2 this entire file gets swapped for a Supabase query — the public
// `queryVisits()` API mirrors the shape a `partner_visits_view` query will have:
//   - .gte('verified_at', cutoff)   (date range)
//   - .eq('status', status)         (status filter)
//   - .or('city.ilike.%q%, ...')    (free-text search)
//   - .order('verified_at', { ascending: false })

import type {
  DateRangePreset,
  Gender,
  LoyaltyTier,
  SubmissionStatus,
  Visit,
} from "@/types/domain";
import { MOCK_STORE } from "./store";

export const MOCK_ENROLLMENT = "2026-02-12";
export const MOCK_TODAY = "2026-05-27";
const TODAY_ISO_END = "2026-05-27T23:59:59+08:00";

/* ------------------------------------------------------------ seeded RNG */

/** Linear-congruential PRNG. Stateful closure over a single integer seed. */
function makeRand(seed: number): () => number {
  let s = Math.abs(Math.floor(seed)) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function weightedPick<T>(rand: () => number, table: Array<[T, number]>): T {
  const r = rand();
  let acc = 0;
  for (const [value, weight] of table) {
    acc += weight;
    if (r < acc) return value;
  }
  return table[table.length - 1][0];
}

/* ------------------------------------------------------------ data tables */

// Mon-first index. Mookata is evening-only; Fri/Sat are the strongest nights.
const WEEKDAY_BASE = [7, 8, 8, 11, 17, 15, 10];

// Slight per-month scale; ramping to "lifetime" target ~1100 visits.
const MONTH_SCALE: Record<number, number> = {
  1: 0.96, // Feb (partial — Feb 12 onward)
  2: 0.87, // Mar
  3: 1.00, // Apr
  4: 0.99, // May
};

// Anchor days from the dashboard/calendar narrative. The generator honors these
// so e.g. Apr 25 is always the busiest single day with a star on the calendar.
const SPECIAL_DAY_COUNTS: Record<string, number> = {
  "2026-04-25": 23, // Sat — best single day
  "2026-05-22": 21, // Fri — peak May
  "2026-05-15": 17,
  "2026-05-23": 16,
  "2026-04-11": 16,
};

const GENDER_TABLE: Array<[Gender, number]> = [
  ["female", 0.52],
  ["male", 0.45],
  ["other", 0.03],
];

const CITY_TABLE: Array<[string, number]> = [
  ["Kuala Lumpur", 0.38],
  ["Petaling Jaya", 0.12],
  ["Kepong", 0.09],
  ["Selayang", 0.08],
  ["Cheras", 0.07],
  ["Subang Jaya", 0.06],
  ["Sungai Buloh", 0.05],
  ["Kajang", 0.05],
  ["Ampang", 0.04],
  ["Penang", 0.03],
  ["Johor Bahru", 0.03],
];

const LOYALTY_TABLE: Array<[LoyaltyTier, number]> = [
  ["new", 0.50],
  ["returning", 0.30],
  ["loyal", 0.20],
];

/* ------------------------------------------------------------ generator */

function monDow(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function visitsCountForDay(day: Date): number {
  const key = dateKey(day);
  if (SPECIAL_DAY_COUNTS[key] !== undefined) return SPECIAL_DAY_COUNTS[key];

  const dow = monDow(day);
  const month = day.getUTCMonth();
  const scale = MONTH_SCALE[month] ?? 1.0;
  const base = WEEKDAY_BASE[dow] * scale;
  const noise = (((day.getUTCDate() * 17 + month * 23) % 5) - 2);
  return Math.max(2, Math.round(base + noise));
}

function ageBucket(rand: () => number): number {
  const r = rand();
  if (r < 0.30) return 18 + Math.floor(rand() * 6);   // 18-23
  if (r < 0.70) return 24 + Math.floor(rand() * 11);  // 24-34
  if (r < 0.88) return 35 + Math.floor(rand() * 10);  // 35-44
  if (r < 0.96) return 45 + Math.floor(rand() * 10);  // 45-54
  return 55 + Math.floor(rand() * 10);                // 55-64
}

function statusForVisit(rand: () => number, day: Date): SubmissionStatus {
  // Older visits are always settled (approved or rejected). Only the last 5
  // days can still have pending status — matches real ops where admin review
  // typically completes within a few days.
  const dayMs = new Date(`${MOCK_TODAY}T00:00:00+08:00`).getTime() - day.getTime();
  const isRecent = dayMs < 5 * 86400000;
  const r = rand();
  if (r < 0.95) return "approved";
  if (r < 0.97 && isRecent) return "pending";
  return "rejected";
}

function generateVisit(visitNum: number, day: Date, slot: number): Visit {
  const rand = makeRand(visitNum * 7919 + slot * 31 + day.getUTCDate());

  // Time of day: 17:00 - 02:00 (mookata window), weighted toward 19:00-22:00.
  const hourPick = rand();
  const hour =
    hourPick < 0.10 ? 17 :
    hourPick < 0.25 ? 18 :
    hourPick < 0.50 ? 19 :
    hourPick < 0.75 ? 20 :
    hourPick < 0.88 ? 21 :
    hourPick < 0.96 ? 22 :
    hourPick < 0.99 ? 23 : 24; // 24 = 00:00 next day
  const minute = Math.floor(rand() * 60);

  const verifiedAt = new Date(day);
  verifiedAt.setUTCHours(hour > 23 ? hour - 24 : hour, minute, 0, 0);
  if (hour > 23) verifiedAt.setUTCDate(verifiedAt.getUTCDate() + 1);
  // Shift to +08:00 reading by subtracting 8 hours from UTC representation.
  verifiedAt.setUTCHours(verifiedAt.getUTCHours() - 8);

  const gender = weightedPick(rand, GENDER_TABLE);
  const age = ageBucket(rand);
  const city = weightedPick(rand, CITY_TABLE);
  const loyaltyTier = weightedPick(rand, LOYALTY_TABLE);
  const status = statusForVisit(rand, day);

  // Bill amount weighted around RM 38 (mookata avg), range RM 22-95.
  const amountRand = rand();
  const totalAmount = Number(
    (22 + amountRand * 73).toFixed(amountRand < 0.5 ? 2 : 0)
  );

  return {
    id: String(visitNum).padStart(5, "0"),
    partnerStoreId: MOCK_STORE.id,
    verifiedAt: verifiedAt.toISOString(),
    age,
    gender,
    city,
    totalAmount,
    status,
    loyaltyTier,
  };
}

function generateAllVisits(): Visit[] {
  const visits: Visit[] = [];
  const start = new Date(`${MOCK_ENROLLMENT}T00:00:00Z`);
  const end = new Date(`${MOCK_TODAY}T00:00:00Z`);

  let visitNum = 10001;
  for (
    let day = new Date(start);
    day <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const n = visitsCountForDay(day);
    for (let i = 0; i < n; i++) {
      visits.push(generateVisit(visitNum, new Date(day), i));
      visitNum++;
    }
  }
  return visits;
}

/* ------------------------------------------------------------ exports */

/** All visits across the enrollment window, sorted newest-first. */
export const MOCK_VISITS: Visit[] = generateAllVisits().sort((a, b) =>
  b.verifiedAt.localeCompare(a.verifiedAt)
);

/** The 8 newest visits — drives the dashboard "Recent visits" feed. */
export const MOCK_RECENT_VISITS = MOCK_VISITS.slice(0, 8);

/* ------------------------------------------------------------ filter helpers
   These mirror the shape of a future Supabase query. The Visits page calls
   `queryVisits({ range, status, search })`; Pass 2 swaps the function body
   for a Supabase call without changing any call sites. */

export type VisitsQuery = {
  range?: DateRangePreset;
  status?: SubmissionStatus | "all";
  search?: string;
};

/** Compute the ISO date cutoff for a given date-range preset, anchored to today. */
export function rangeCutoff(range: DateRangePreset, todayIso = TODAY_ISO_END): string | null {
  if (range === "custom") return null;
  const today = new Date(todayIso);
  const cutoff = new Date(today);
  switch (range) {
    case "today":
      cutoff.setHours(0, 0, 0, 0);
      break;
    case "7d":
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case "30d":
      cutoff.setDate(cutoff.getDate() - 30);
      break;
    case "3m":
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
  }
  return cutoff.toISOString();
}

/** Filter + search + sort, returning the resulting slice. Sync (Pass 1 mock).
 *  Future Supabase version returns Promise<Visit[]> with identical shape. */
export function queryVisits(query: VisitsQuery = {}): Visit[] {
  const { range, status, search } = query;
  let result = MOCK_VISITS;

  if (range && range !== "custom") {
    const cutoff = rangeCutoff(range);
    if (cutoff) result = result.filter((v) => v.verifiedAt >= cutoff);
  }

  if (status && status !== "all") {
    result = result.filter((v) => v.status === status);
  }

  if (search) {
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          v.id.includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.gender.toLowerCase().includes(q) ||
          String(v.totalAmount).includes(q) ||
          String(v.age).includes(q)
      );
    }
  }

  return result;
}
