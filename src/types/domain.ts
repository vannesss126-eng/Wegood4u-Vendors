// Wegood4u Vendors — shared domain types.
// Used by mock data in lib/mock/* and future Supabase queries.
// When we wire Supabase, generated types (database.ts) feed into these
// hand-rolled domain shapes via lib/api adapters.

export type Platform = "youtube" | "tiktok" | "instagram";

export type CurationStatus = "pending" | "assigned" | "general" | "skipped";

export type SubmissionStatus = "approved" | "pending" | "rejected";

export type LoyaltyTier = "new" | "returning" | "loyal";

export type Gender = "male" | "female" | "other";

export type BillingStatus = "draft" | "issued" | "paid";

/** Date-range presets used by filter chips. `custom` is a UI-only no-op
 *  until a date-picker modal lands (Pass 2 / Phase J). */
export type DateRangePreset = "today" | "7d" | "30d" | "3m" | "custom";

export interface PartnerStore {
  id: string;
  name: string;
  type: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  hours: string;
  days: string;
  priceRange: string;
  description: string;
  enrolledAt: string;
  perVisitFee: number;
  plan: "Starter" | "Growth" | "Premium";
}

export interface Visit {
  id: string;
  partnerStoreId: string;
  verifiedAt: string;
  age: number;
  gender: Gender;
  city: string;
  totalAmount: number;
  status: SubmissionStatus;
  loyaltyTier: LoyaltyTier;
}

export interface KpiSnapshot {
  verifiedVisits: { thisMonth: number; lastMonth: number; lifetime: number };
  customerSpend: { thisMonth: number; lastMonth: number };
  amountOwed: { thisMonth: number; lastMonth: number };
  contentReach: { status: "coming-soon" | "live"; totalViews?: number };
}

export interface VisitTrendPoint {
  date: string;
  count: number;
}

export interface AgeBracket {
  bracket: "18-24" | "25-34" | "35-44" | "45-54" | "55+";
  count: number;
  percent: number;
}

export interface GenderBreakdown {
  gender: Gender;
  count: number;
  percent: number;
}

export interface CountryBreakdown {
  country: string;
  countryCode: string;
  count: number;
  percent: number;
}

export interface LoyaltyBreakdown {
  tier: LoyaltyTier;
  label: string;
  count: number;
  percent: number;
}

export interface Demographics {
  totalVisitors: number;
  uniqueVisitors: number;
  ageDistribution: AgeBracket[];
  genderBreakdown: GenderBreakdown[];
  topCountries: CountryBreakdown[];
  loyaltyTiers: LoyaltyBreakdown[];
}

export interface DailyVisitCount {
  date: string;
  count: number | null;
}

export interface CalendarStats {
  bestSingleDay: { date: string; count: number };
  busiestWeekday: { weekday: string; avgPerWeek: number; percentOfTotal: number };
  topMonth: { label: string; count: number };
  lifetimeVisits: number;
  dailyCounts: DailyVisitCount[];
  weekdayBreakdown: { weekday: string; count: number; percent: number }[];
  topBusiestDays: { date: string; weekday: string; count: number; note?: string }[];
}

export interface BillingStatement {
  id: string;
  month: string;
  periodStart: string;
  periodEnd: string;
  verifiedVisits: number;
  perVisitFee: number;
  amountOwed: number;
  customerSpend: number;
  status: BillingStatus;
  issuedAt?: string;
  paidAt?: string;
}

export interface ContentPost {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  thumbnailGradient: [string, string];
  durationSec: number;
  publishedAt: string;
  channelsLive: number;
  views: number;
  likes: number;
  perChannelViews: Partial<Record<Platform, number>>;
  isTopPerformer?: boolean;
}

export interface ChannelBreakdown {
  platform: Platform;
  views: number;
  likes: number;
  percent: number;
}

export interface ContentSnapshot {
  totalViews: number;
  totalLikes: number;
  activeVideos: number;
  totalPosts: number;
  topChannel: Platform;
  monthOverMonthDelta: number;
  channelMix: ChannelBreakdown[];
  posts: ContentPost[];
  cumulativeTrend: { date: string; total: number }[];
}
