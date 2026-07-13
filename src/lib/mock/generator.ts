// Per-store dataset generator (live).
//
// `buildStoreDataset(config, today)` turns a store profile + its monthly
// verified-visit targets into a full, self-consistent dataset anchored to the
// real current date `today`: individual visit records (from enrollment up to
// today), KPIs, visit trend, demographics, a rolling 12-month calendar, billing
// statements, and content stats.
//
// Historical months (through the last explicitly-configured month) use their
// exact targets; every month after that up to today runs at the store's normal
// monthly rate, with the current month pro-rated to the day. So the whole app
// tracks the actual current day — "this month" is the real current month.
//
// The public query methods (queryVisits / queryDemographics / queryCalendarStats)
// mirror the shape of the future Supabase calls, so Pass 2 swaps the dataset
// source without touching the pages.

import type {
  AgeBracket,
  BillingStatement,
  CalendarStats,
  ChannelBreakdown,
  ContentPost,
  ContentSnapshot,
  DailyVisitCount,
  DateRangePreset,
  Demographics,
  Gender,
  GenderBreakdown,
  KpiSnapshot,
  LoyaltyBreakdown,
  LoyaltyTier,
  MonthlyVisitPoint,
  PartnerStore,
  Platform,
  SubmissionStatus,
  Visit,
} from "@/types/domain";
import {
  activeDaysInMonth,
  addMonthKey,
  dayOrdinal,
  daysInMonthOf,
  hashString,
  makeRand,
  mondayDow,
  MONTH_NAMES_LONG,
  MONTH_NAMES_SHORT,
  nextMonthKey,
  pad2,
  prevMonthKey,
  weightedPick,
} from "./constants";

/* ============================================================
   Config + dataset shapes
   ============================================================ */

export interface StoreConfig {
  store: PartnerStore;
  /** Short prefix for visit ids, e.g. "BJ". */
  code: string;
  /** Explicit verified (approved) visits for historical months, keyed YYYY-MM. */
  monthlyTargets: Record<string, number>;
  /** Normal full-month verified-visit volume — used for every month after the
   *  last explicit month (the current month is pro-rated to the day). */
  normalMonthly: number;
  /** Lifetime favourite count (mock fallback for the Favorites KPI). */
  favorites: number;
  /** Per-visit bill distribution (RM). */
  avgAmount: number;
  amountSpread: number;
  minAmount: number;
  maxAmount: number;
  /** Weighted city pool for anonymised visitor origin. */
  cityTable: Array<[string, number]>;
  /** Content reach scale (1.0 ≈ flagship store) + display area name. */
  contentScale: number;
  contentArea: string;
}

export interface StoreDataset {
  store: PartnerStore;
  /** The real current date (YYYY-MM-DD) this dataset is anchored to. */
  today: string;
  /** Current month key (YYYY-MM). */
  currentMonth: string;
  kpis: KpiSnapshot;
  visitTrend: MonthlyVisitPoint[];
  visits: Visit[];
  recentVisits: Visit[];
  dailyCounts: DailyVisitCount[];
  demographicsLifetime: Demographics;
  calendarFull: CalendarStats;
  currentStatement: BillingStatement;
  billingHistory: BillingStatement[];
  content: ContentSnapshot;
  queryVisits: (query?: VisitsQuery) => Visit[];
  queryDemographics: (query?: DemographicsQuery) => Demographics;
  queryCalendarStats: (query?: CalendarQuery) => CalendarStats;
}

/* ============================================================
   Distribution tables (shared across stores)
   ============================================================ */

// Mon-first weekday weighting — mookata is evening-only, Fri/Sat are strongest.
const WEEKDAY_WEIGHT = [7, 8, 8, 11, 17, 15, 10];

const GENDER_TABLE: Array<[Gender, number]> = [
  ["female", 0.52],
  ["male", 0.45],
  ["other", 0.03],
];

const LOYALTY_TABLE: Array<[LoyaltyTier, number]> = [
  ["new", 0.5],
  ["returning", 0.3],
  ["loyal", 0.2],
];

function ageBucket(rand: () => number): number {
  const r = rand();
  if (r < 0.3) return 18 + Math.floor(rand() * 6); // 18-23
  if (r < 0.7) return 24 + Math.floor(rand() * 11); // 24-34
  if (r < 0.88) return 35 + Math.floor(rand() * 10); // 35-44
  if (r < 0.96) return 45 + Math.floor(rand() * 10); // 45-54
  return 55 + Math.floor(rand() * 10); // 55-64
}

/* ============================================================
   Monthly targets — historical explicit + ongoing normal rate
   ============================================================ */

/** All month targets from enrollment through the current (real) month. Months
 *  past the last explicit config month run at the normal rate; the current
 *  month is pro-rated to the day so it fills in as the month progresses. */
function computeTargets(cfg: StoreConfig, today: string): Record<string, number> {
  const targets: Record<string, number> = { ...cfg.monthlyTargets };
  const explicit = Object.keys(cfg.monthlyTargets).sort();
  const lastExplicit = explicit[explicit.length - 1];
  const currentMonth = today.slice(0, 7);

  let mk = nextMonthKey(lastExplicit);
  while (mk <= currentMonth) {
    if (mk === currentMonth) {
      const day = Number(today.slice(8, 10));
      targets[mk] = Math.max(1, Math.round((cfg.normalMonthly * day) / daysInMonthOf(mk)));
    } else {
      targets[mk] = cfg.normalMonthly;
    }
    mk = nextMonthKey(mk);
  }
  return targets;
}

/* ============================================================
   Visit generation
   ============================================================ */

/** Spread a monthly total across its active days, weekday-weighted.
 *  Largest-remainder method → the day counts always sum to exactly `target`. */
function distribute(target: number, days: string[]): Map<string, number> {
  const result = new Map<string, number>();
  if (days.length === 0 || target <= 0) return result;

  const weights = days.map((d) => WEEKDAY_WEIGHT[mondayDow(d)]);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (target * w) / wsum);
  const counts = raw.map((r) => Math.floor(r));
  let remainder = target - counts.reduce((a, b) => a + b, 0);

  const byFraction = raw
    .map((r, i) => ({ frac: r - Math.floor(r), i }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; remainder > 0; k++, remainder--) {
    counts[byFraction[k % byFraction.length].i]++;
  }

  days.forEach((d, i) => result.set(d, counts[i]));
  return result;
}

function makeVisit(
  cfg: StoreConfig,
  seedBase: number,
  dateStr: string,
  slot: number,
  counter: number,
  status: SubmissionStatus
): Visit {
  const rand = makeRand(
    seedBase + dayOrdinal(dateStr) * 131 + slot * 17 + counter * 7
  );

  // Evening window 17:00–23:30, weighted toward 19:00–21:00. Kept before
  // midnight so every visit buckets cleanly into its own calendar day/month.
  const hp = rand();
  const hour =
    hp < 0.1 ? 17 : hp < 0.25 ? 18 : hp < 0.5 ? 19 : hp < 0.72 ? 20 : hp < 0.88 ? 21 : hp < 0.97 ? 22 : 23;
  const minute = Math.floor(rand() * 60);
  const verifiedAt = `${dateStr}T${pad2(hour)}:${pad2(minute)}:00+08:00`;

  const gender = weightedPick(rand, GENDER_TABLE);
  const age = ageBucket(rand);
  const city = weightedPick(rand, cfg.cityTable);
  const loyaltyTier = weightedPick(rand, LOYALTY_TABLE);

  const raw = cfg.avgAmount + (rand() * 2 - 1) * cfg.amountSpread;
  const clamped = Math.min(cfg.maxAmount, Math.max(cfg.minAmount, raw));
  const totalAmount = Number(clamped.toFixed(rand() < 0.5 ? 2 : 0));

  return {
    id: `${cfg.code}-${String(counter).padStart(4, "0")}`,
    partnerStoreId: cfg.store.id,
    verifiedAt,
    age,
    gender,
    city,
    totalAmount,
    status,
    loyaltyTier,
  };
}

function generateVisits(
  cfg: StoreConfig,
  seedBase: number,
  today: string,
  targets: Record<string, number>
): Visit[] {
  const visits: Visit[] = [];
  let counter = 1;

  // Approved visits — matching the monthly targets, capped at today.
  for (const mk of Object.keys(targets).sort()) {
    const target = targets[mk];
    const days = activeDaysInMonth(mk, cfg.store.enrolledAt, today);
    const counts = distribute(target, days);
    for (const dateStr of days) {
      const c = counts.get(dateStr) ?? 0;
      for (let i = 0; i < c; i++) {
        visits.push(makeVisit(cfg, seedBase, dateStr, i, counter++, "approved"));
      }
    }
  }

  // A small, realistic tail of not-yet-settled / rejected visits near today so
  // the Visits status filter isn't empty. These are extra — they never count
  // toward the "verified" (approved) totals the KPIs report.
  const enrolled = cfg.store.enrolledAt;
  const dayBefore = (n: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  for (const n of [0, 1]) {
    const d = dayBefore(n);
    if (d >= enrolled) visits.push(makeVisit(cfg, seedBase, d, 90 + n, counter++, "pending"));
  }
  const rej = dayBefore(9);
  if (rej >= enrolled) visits.push(makeVisit(cfg, seedBase, rej, 95, counter++, "rejected"));

  return visits.sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));
}

/* ============================================================
   Aggregation helpers (operate on a visit list)
   ============================================================ */

const approvedOnly = (visits: Visit[]) => visits.filter((v) => v.status === "approved");
const inMonth = (visits: Visit[], mk: string) =>
  visits.filter((v) => v.verifiedAt.slice(0, 7) === mk);

function sumSpend(visits: Visit[]): number {
  return Math.round(visits.reduce((a, v) => a + v.totalAmount, 0));
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Age / gender / area / loyalty rollup over a visit list (visit-based counts). */
function aggregateDemographics(visits: Visit[]): Demographics {
  const total = visits.length;

  const buckets: Record<AgeBracket["bracket"], number> = {
    "18-24": 0,
    "25-34": 0,
    "35-44": 0,
    "45-54": 0,
    "55+": 0,
  };
  for (const v of visits) {
    if (v.age <= 24) buckets["18-24"]++;
    else if (v.age <= 34) buckets["25-34"]++;
    else if (v.age <= 44) buckets["35-44"]++;
    else if (v.age <= 54) buckets["45-54"]++;
    else buckets["55+"]++;
  }
  const ageDistribution: AgeBracket[] = (
    ["18-24", "25-34", "35-44", "45-54", "55+"] as AgeBracket["bracket"][]
  ).map((bracket) => ({
    bracket,
    count: buckets[bracket],
    percent: pct(buckets[bracket], total),
  }));

  const genderCounts: Record<Gender, number> = { female: 0, male: 0, other: 0 };
  for (const v of visits) genderCounts[v.gender]++;
  const genderBreakdown: GenderBreakdown[] = (
    ["female", "male", "other"] as Gender[]
  ).map((gender) => ({
    gender,
    count: genderCounts[gender],
    percent: pct(genderCounts[gender], total),
  }));

  // Top customer areas — repurposes the topCountries field for cities (the mock
  // carries only city). Pages relabel the card. Pass 2 will have city + country.
  const cityCounts: Record<string, number> = {};
  for (const v of visits) cityCounts[v.city] = (cityCounts[v.city] ?? 0) + 1;
  const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const topFour = sorted.slice(0, 4);
  const otherCount = sorted.slice(4).reduce((a, [, n]) => a + n, 0);
  const topCountries = topFour.map(([city, count]) => ({
    country: city,
    countryCode: city.slice(0, 2).toUpperCase(),
    count,
    percent: pct(count, total),
  }));
  if (otherCount > 0) {
    topCountries.push({
      country: `Other (${sorted.length - 4} areas)`,
      countryCode: "",
      count: otherCount,
      percent: pct(otherCount, total),
    });
  }

  const tierCounts: Record<LoyaltyTier, number> = { new: 0, returning: 0, loyal: 0 };
  for (const v of visits) tierCounts[v.loyaltyTier]++;
  const loyaltyTiers: LoyaltyBreakdown[] = (
    ["new", "returning", "loyal"] as LoyaltyTier[]
  ).map((tier) => ({
    tier,
    label: tier === "new" ? "New" : tier === "returning" ? "Returning" : "Loyal (3+)",
    count: tierCounts[tier],
    percent: pct(tierCounts[tier], total),
  }));

  return {
    totalVisitors: total,
    uniqueVisitors: total,
    ageDistribution,
    genderBreakdown,
    topCountries,
    loyaltyTiers,
  };
}

/** Lifetime demographics — loyalty tiers recast to UNIQUE customers so the
 *  dashboard donut (center = Total unique) stays internally consistent. */
function lifetimeDemographics(approved: Visit[]): Demographics {
  const base = aggregateDemographics(approved);
  const unique = Math.max(1, Math.round(approved.length * 0.68));
  const split: Array<[LoyaltyTier, string, number]> = [
    ["new", "New", 0.52],
    ["returning", "Returning", 0.3],
    ["loyal", "Loyal (3+)", 0.18],
  ];
  let assigned = 0;
  const loyaltyTiers: LoyaltyBreakdown[] = split.map(([tier, label, frac], i) => {
    const count =
      i === split.length - 1 ? unique - assigned : Math.round(unique * frac);
    assigned += count;
    return { tier, label, count, percent: pct(count, unique) };
  });
  return { ...base, uniqueVisitors: unique, loyaltyTiers };
}

/* ============================================================
   Calendar
   ============================================================ */

/** First day (YYYY-MM-DD) of the month 11 months before `today`. */
function windowStart12(today: string): string {
  const [y, m] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 - 11, 1)).toISOString().slice(0, 10);
}

/** Daily approved-visit counts across the 12 months ending on `today`.
 *  null for pre-enrollment days; real counts (0 for quiet days) otherwise. */
function buildDailyCounts(
  approved: Visit[],
  enrolledAt: string,
  today: string
): DailyVisitCount[] {
  const byDay = new Map<string, number>();
  for (const v of approved) {
    const d = v.verifiedAt.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }

  const out: DailyVisitCount[] = [];
  const start = new Date(`${windowStart12(today)}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr < enrolledAt) {
      out.push({ date: dateStr, count: null });
    } else {
      out.push({ date: dateStr, count: byDay.get(dateStr) ?? 0 });
    }
  }
  return out;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LONG = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

/** Recompute calendar KPIs over the last `months` of the daily-count window,
 *  anchored to `today`. */
function buildCalendarStats(
  dailyCounts: DailyVisitCount[],
  months: number,
  today: string
): CalendarStats {
  const t = new Date(`${today}T00:00:00Z`);
  const start = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - (months - 1), 1)
  );
  const sliced = dailyCounts.filter(
    (d) => new Date(`${d.date}T00:00:00Z`) >= start
  );
  const active = sliced.filter(
    (d): d is { date: string; count: number } => d.count != null && d.count > 0
  );

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  const weekdayOccurrences = [0, 0, 0, 0, 0, 0, 0];
  for (const d of active) {
    const dow = mondayDow(d.date);
    weekdayTotals[dow] += d.count;
    weekdayOccurrences[dow]++;
  }
  const weekdaySum = weekdayTotals.reduce((a, b) => a + b, 0);
  const weekdayBreakdown = WEEKDAY_LABELS.map((weekday, i) => ({
    weekday,
    count: weekdayTotals[i],
    percent: pct(weekdayTotals[i], weekdaySum),
  }));

  // Busiest day — ties resolve to the most RECENT day (>=), not the earliest,
  // so the calendar star lands on a relevant recent day rather than the first
  // day the store ever hit its (often tiny) per-day max.
  const best = active.reduce(
    (acc, d) => (d.count >= acc.count ? d : acc),
    active[0] ?? { date: "", count: 0 }
  );

  let busyIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (weekdayTotals[i] > weekdayTotals[busyIdx]) busyIdx = i;
  }

  const monthTotals = new Map<string, number>();
  for (const d of active) {
    const key = d.date.slice(0, 7);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + d.count);
  }
  let topMonthKey = "";
  let topMonthCount = 0;
  for (const [key, count] of monthTotals) {
    if (count > topMonthCount) {
      topMonthKey = key;
      topMonthCount = count;
    }
  }
  const topMonthLabel = topMonthKey
    ? `${MONTH_NAMES_LONG[Number(topMonthKey.slice(5, 7)) - 1]} ${topMonthKey.slice(0, 4)}`
    : "—";

  const weekdayName = (iso: string) =>
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      new Date(`${iso}T00:00:00Z`).getUTCDay()
    ];
  const topBusiestDays = [...active]
    .sort((a, b) => b.count - a.count || b.date.localeCompare(a.date))
    .slice(0, 5)
    .map((d) => ({ date: d.date, weekday: weekdayName(d.date), count: d.count }));

  return {
    bestSingleDay: { date: best.date, count: best.count },
    busiestWeekday: {
      weekday: WEEKDAY_LONG[busyIdx],
      avgPerWeek: Math.round(
        weekdayTotals[busyIdx] / Math.max(1, weekdayOccurrences[busyIdx])
      ),
      percentOfTotal: weekdayBreakdown[busyIdx].percent,
    },
    topMonth: { label: topMonthLabel, count: topMonthCount },
    lifetimeVisits: weekdaySum,
    dailyCounts: sliced,
    weekdayBreakdown,
    topBusiestDays,
  };
}

/* ============================================================
   Visits query (filter / search / range) — mirrors Supabase call shape
   ============================================================ */

export type VisitsQuery = {
  range?: DateRangePreset;
  status?: SubmissionStatus | "all";
  search?: string;
};

/** Cutoff timestamp (ms) for a date-range preset, anchored to end-of-today. */
function rangeCutoffMs(range: DateRangePreset, today: string): number | null {
  if (range === "custom") return null;
  if (range === "today") return new Date(`${today}T00:00:00+08:00`).getTime();
  const c = new Date(`${today}T23:59:59+08:00`);
  if (range === "7d") c.setDate(c.getDate() - 7);
  else if (range === "30d") c.setDate(c.getDate() - 30);
  else if (range === "3m") c.setMonth(c.getMonth() - 3);
  return c.getTime();
}

function filterVisits(all: Visit[], query: VisitsQuery, today: string): Visit[] {
  const { range, status, search } = query;
  let result = all;

  if (range && range !== "custom") {
    const cutoff = rangeCutoffMs(range, today);
    // Compare by absolute timestamp — visits + cutoff can carry different
    // offsets, so a string comparison would be wrong.
    if (cutoff != null) {
      result = result.filter((v) => new Date(v.verifiedAt).getTime() >= cutoff);
    }
  }
  if (status && status !== "all") {
    result = result.filter((v) => v.status === status);
  }
  if (search) {
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.gender.toLowerCase().includes(q) ||
          String(v.totalAmount).includes(q) ||
          String(v.age).includes(q)
      );
    }
  }
  return result;
}

export type DemographicsQuery = { month?: string };
export type CalendarQuery = { months?: number };

/* ============================================================
   Billing
   ============================================================ */

function buildStatements(
  cfg: StoreConfig,
  approved: Visit[],
  targets: Record<string, number>,
  today: string
): { current: BillingStatement; history: BillingStatement[] } {
  const fee = cfg.store.perVisitFee;
  const currentMonth = today.slice(0, 7);
  const months = Object.keys(targets).sort();

  const statements: BillingStatement[] = months.map((mk) => {
    const [y, m] = mk.split("-").map(Number);
    const monthVisits = inMonth(approved, mk);
    const verifiedVisits = monthVisits.length;
    const customerSpend = sumSpend(monthVisits);
    const lastDay = daysInMonthOf(mk);
    const isEnrollMonth = cfg.store.enrolledAt.slice(0, 7) === mk;
    const isCurrent = mk === currentMonth;
    const monthName = MONTH_NAMES_LONG[m - 1];
    return {
      id: `stmt-${mk}`,
      month: `${monthName} ${y}${isEnrollMonth ? " (partial)" : ""}`,
      periodStart: isEnrollMonth ? cfg.store.enrolledAt : `${mk}-01`,
      periodEnd: `${mk}-${pad2(lastDay)}`,
      verifiedVisits,
      perVisitFee: fee,
      amountOwed: Number((verifiedVisits * fee).toFixed(2)),
      customerSpend,
      status: isCurrent ? "draft" : "paid",
      issuedAt: isCurrent ? undefined : `${nextMonthKey(mk)}-01`,
      paidAt: isCurrent ? undefined : `${nextMonthKey(mk)}-07`,
    } satisfies BillingStatement;
  });

  const current =
    statements.find((s) => s.id === `stmt-${currentMonth}`) ??
    statements[statements.length - 1];
  const history = statements
    .filter((s) => s.id !== current.id)
    .sort((a, b) => b.id.localeCompare(a.id));
  return { current, history };
}

/* ============================================================
   Content (Wegood4u-produced videos, scaled per store)
   ============================================================ */

function buildContent(cfg: StoreConfig, today: string): ContentSnapshot {
  const s = cfg.contentScale;
  const scale = (n: number) => Math.round(n * s);

  const posts: ContentPost[] = [
    {
      id: `${cfg.code}-yt-1`,
      platform: "youtube",
      title: `Best Mookata in ${cfg.contentArea} — ${cfg.store.name} full tour`,
      url: "https://youtube.com/watch?v=mock-thaigeng-tour",
      thumbnailGradient: ["#3FB97E", "#206E56"],
      durationSec: 222,
      publishedAt: "2026-04-12",
      channelsLive: 3,
      views: scale(88600),
      likes: scale(5400),
      perChannelViews: {
        youtube: scale(41200),
        tiktok: scale(31800),
        instagram: scale(15600),
      },
      isTopPerformer: true,
    },
    {
      id: `${cfg.code}-yt-2`,
      platform: "youtube",
      title: `Inside ${cfg.store.name} — the owner's mookata story`,
      url: "https://youtube.com/watch?v=mock-thaigeng-owner",
      thumbnailGradient: ["#2a8167", "#16513F"],
      durationSec: 138,
      publishedAt: "2026-03-18",
      channelsLive: 2,
      views: scale(20100),
      likes: scale(1400),
      perChannelViews: { youtube: scale(13800), tiktok: scale(6300) },
    },
    {
      id: `${cfg.code}-tt-1`,
      platform: "tiktok",
      title: `Clear-broth secret — ${cfg.contentArea} mookata night`,
      url: "https://tiktok.com/@wegood4u/video/mock-broth",
      thumbnailGradient: ["#5a9c8a", "#2a6651"],
      durationSec: 68,
      publishedAt: "2026-02-22",
      channelsLive: 2,
      views: scale(7600),
      likes: scale(480),
      perChannelViews: { tiktok: scale(4200), instagram: scale(3400) },
    },
  ];

  const ytViews = posts.reduce((a, p) => a + (p.perChannelViews.youtube ?? 0), 0);
  const ttViews = posts.reduce((a, p) => a + (p.perChannelViews.tiktok ?? 0), 0);
  const igViews = posts.reduce((a, p) => a + (p.perChannelViews.instagram ?? 0), 0);
  const totalViews = ytViews + ttViews + igViews;
  const ytLikes = scale(3340);
  const ttLikes = scale(2800);
  const igLikes = scale(1315);

  const channelMix: ChannelBreakdown[] = (
    [
      ["youtube", ytViews, ytLikes],
      ["tiktok", ttViews, ttLikes],
      ["instagram", igViews, igLikes],
    ] as Array<[Platform, number, number]>
  ).map(([platform, views, likes]) => ({
    platform,
    views,
    likes,
    percent: pct(views, totalViews),
  }));

  // 30-day cumulative view trend, growing to totalViews, ending today.
  const growth = [
    0.743, 0.751, 0.76, 0.77, 0.782, 0.79, 0.796, 0.802, 0.81, 0.818, 0.83,
    0.844, 0.853, 0.859, 0.866, 0.874, 0.882, 0.897, 0.912, 0.923, 0.929, 0.936,
    0.945, 0.955, 0.971, 0.984, 0.992, 0.996, 0.999, 1.0,
  ];
  const trendStart = new Date(`${today}T00:00:00Z`);
  trendStart.setUTCDate(trendStart.getUTCDate() - (growth.length - 1));
  const cumulativeTrend = growth.map((g, i) => {
    const d = new Date(trendStart);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      total: i === growth.length - 1 ? totalViews : Math.round(totalViews * g),
    };
  });

  return {
    totalViews,
    totalLikes: ytLikes + ttLikes + igLikes,
    activeVideos: posts.length,
    totalPosts: posts.reduce((a, p) => a + p.channelsLive, 0),
    topChannel: "youtube",
    monthOverMonthDelta: 23,
    channelMix,
    posts,
    cumulativeTrend,
  };
}

/* ============================================================
   Assembly
   ============================================================ */

export function buildStoreDataset(cfg: StoreConfig, today: string): StoreDataset {
  const seedBase = hashString(cfg.store.id);
  const fee = cfg.store.perVisitFee;
  const currentMonth = today.slice(0, 7);
  const lastMonth = prevMonthKey(currentMonth);

  const targets = computeTargets(cfg, today);
  const visits = generateVisits(cfg, seedBase, today, targets);
  const approved = approvedOnly(visits);

  const thisMonthVisits = inMonth(approved, currentMonth);
  const lastMonthVisits = inMonth(approved, lastMonth);

  // Last 7 days incl. today.
  const weekStartDate = new Date(`${today}T00:00:00Z`);
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - 6);
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const todayCount = approved.filter((v) => v.verifiedAt.slice(0, 10) === today).length;
  const weekCount = approved.filter((v) => v.verifiedAt.slice(0, 10) >= weekStart).length;

  const content = buildContent(cfg, today);

  const kpis: KpiSnapshot = {
    verifiedVisits: {
      thisMonth: thisMonthVisits.length,
      lastMonth: lastMonthVisits.length,
      lifetime: approved.length,
      today: todayCount,
      thisWeek: weekCount,
    },
    customerSpend: {
      thisMonth: sumSpend(thisMonthVisits),
      lastMonth: sumSpend(lastMonthVisits),
    },
    amountOwed: {
      thisMonth: Number((thisMonthVisits.length * fee).toFixed(2)),
      lastMonth: Number((lastMonthVisits.length * fee).toFixed(2)),
    },
    contentReach: { status: "live", totalViews: content.totalViews },
    favorites: cfg.favorites,
  };

  // Visit trend — last 6 months ending on the current month.
  const visitTrend: MonthlyVisitPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const mk = addMonthKey(currentMonth, -i);
    visitTrend.push({
      label: MONTH_NAMES_SHORT[Number(mk.slice(5, 7)) - 1],
      visits: inMonth(approved, mk).length,
    });
  }

  const dailyCounts = buildDailyCounts(approved, cfg.store.enrolledAt, today);
  const calendarFull = buildCalendarStats(dailyCounts, 12, today);
  const demographicsLifetime = lifetimeDemographics(approved);
  const { current, history } = buildStatements(cfg, approved, targets, today);

  return {
    store: cfg.store,
    today,
    currentMonth,
    kpis,
    visitTrend,
    visits,
    recentVisits: approved.slice(0, 8),
    dailyCounts,
    demographicsLifetime,
    calendarFull,
    currentStatement: current,
    billingHistory: history,
    content,
    queryVisits: (query = {}) => filterVisits(visits, query, today),
    queryDemographics: (query) => {
      if (!query?.month) return demographicsLifetime;
      return aggregateDemographics(inMonth(approved, query.month));
    },
    queryCalendarStats: (query) =>
      buildCalendarStats(dailyCounts, query?.months ?? 12, today),
  };
}
