// Customer demographics rollup for Thai Geng Mookata.
// Skewed young (mookata is a social, value-priced meal popular with students
// and young professionals). 92% Malaysian. Loyalty: ~50% new, 30% returning,
// 20% loyal — typical for a 3.5-month-enrolled store.
//
// All distributions count UNIQUE customers (712). Demographics measure WHO
// the customers are, not how many visits — a single returning customer is
// counted once across age/gender/country.

import type {
  AgeBracket,
  Demographics,
  Gender,
  GenderBreakdown,
  LoyaltyBreakdown,
  LoyaltyTier,
} from "@/types/domain";
import { MOCK_VISITS } from "./visits";

export const MOCK_DEMOGRAPHICS: Demographics = {
  totalVisitors: 1108,
  uniqueVisitors: 712,

  ageDistribution: [
    { bracket: "18-24", count: 214, percent: 30 },
    { bracket: "25-34", count: 285, percent: 40 },
    { bracket: "35-44", count: 128, percent: 18 },
    { bracket: "45-54", count:  57, percent:  8 },
    { bracket: "55+",   count:  28, percent:  4 },
  ],

  genderBreakdown: [
    { gender: "female", count: 370, percent: 52 },
    { gender: "male",   count: 320, percent: 45 },
    { gender: "other",  count:  22, percent:  3 },
  ],

  topCountries: [
    { country: "Malaysia",  countryCode: "MY", count: 655, percent: 92 },
    { country: "Singapore", countryCode: "SG", count:  28, percent:  4 },
    { country: "Thailand",  countryCode: "TH", count:  14, percent:  2 },
    { country: "Indonesia", countryCode: "ID", count:   8, percent:  1 },
    { country: "Other",     countryCode: "",   count:   7, percent:  1 },
  ],

  loyaltyTiers: [
    { tier: "new",       label: "New",        count: 354, percent: 50 },
    { tier: "returning", label: "Returning",  count: 214, percent: 30 },
    { tier: "loyal",     label: "Loyal (3+)", count: 144, percent: 20 },
  ],
};

/* ============================================================
   queryDemographics — per-period aggregator from MOCK_VISITS.
   Mirrors the shape of a future Supabase RPC. Pass 2 swaps the
   body for a `partner_demographics_view` query; call sites don't change.
   ============================================================ */

export type DemographicsQuery = {
  /** Calendar month key like "2026-05". If omitted, returns lifetime MOCK_DEMOGRAPHICS. */
  month?: string;
};

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function queryDemographics(query: DemographicsQuery = {}): Demographics {
  if (!query.month) return MOCK_DEMOGRAPHICS;

  const [yearStr, monthStr] = query.month.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1; // 0-indexed
  const visits = MOCK_VISITS.filter((v) => {
    const d = new Date(v.verifiedAt);
    return d.getFullYear() === year && d.getMonth() === monthIdx;
  });
  const total = visits.length;

  // Age distribution
  const buckets: Record<AgeBracket["bracket"], number> = {
    "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0,
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

  // Gender
  const genderCounts: Record<Gender, number> = { female: 0, male: 0, other: 0 };
  for (const v of visits) genderCounts[v.gender]++;
  const genderBreakdown: GenderBreakdown[] = (
    ["female", "male", "other"] as Gender[]
  ).map((gender) => ({
    gender,
    count: genderCounts[gender],
    percent: pct(genderCounts[gender], total),
  }));

  // Top customer areas — repurposes the topCountries field for cities since
  // MOCK_VISITS only carries city data (no country attr). Page relabels the
  // card accordingly. Pass 2's real data will have both country + city.
  const cityCounts: Record<string, number> = {};
  for (const v of visits) cityCounts[v.city] = (cityCounts[v.city] ?? 0) + 1;
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const topFour = sortedCities.slice(0, 4);
  const otherCount = sortedCities.slice(4).reduce((a, [, n]) => a + n, 0);
  const topCountries = topFour.map(([city, count]) => ({
    country: city,
    countryCode: city.slice(0, 2).toUpperCase(),
    count,
    percent: pct(count, total),
  }));
  if (otherCount > 0) {
    topCountries.push({
      country: `Other (${sortedCities.length - 4} areas)`,
      countryCode: "",
      count: otherCount,
      percent: pct(otherCount, total),
    });
  }

  // Loyalty tiers
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
    // No customer_id in mock data — for monthly view uniqueVisitors ≈ total.
    // Pass 2 will count distinct user_id per partner_store_id in the period.
    uniqueVisitors: total,
    ageDistribution,
    genderBreakdown,
    topCountries,
    loyaltyTiers,
  };
}
