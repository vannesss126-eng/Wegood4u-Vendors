// The three Thai Geng partner stores, mirrored from the Supabase `partner_stores`
// rows. Verified-visit targets (this month, May 2026): Bukit Jalil 30 · SS2 20 ·
// Bukit Raja Klang 50. Prior months are proportional so trends/deltas populate.
//
// enrolledAt, perVisitFee and plan are mock (not in partner_stores). They vary
// per store so the demo shows different partnership states + billing history.

import type { PartnerStore } from "@/types/domain";
import type { StoreConfig } from "./generator";

const MOOKATA_DESCRIPTION =
  "A highly popular, family-friendly Thai steamboat and BBQ (Mookata) buffet chain across the Klang Valley. Fresh ingredients, traditional charcoal broth, and unlimited refills with a 120-minute dining limit.";

/* ------------------------------------------------------------ Bukit Jalil */

const BUKIT_JALIL: PartnerStore = {
  id: "tg-bukit-jalil",
  name: "Thai Geng Mookata Bukit Jalil",
  type: "Thai Mookata · Buffet",
  city: "Kuala Lumpur",
  address:
    "9-8-G Jalan Jalil Perkasa 15, Arked Esplanad, Bukit Jalil, 57000 Kuala Lumpur",
  phone: "+60 17-936 0138",
  rating: 4.9,
  hours: "Mon–Fri 12:00–01:00 · Weekends 12:00–02:00",
  days: "Mon – Sun",
  priceRange: "RM 20 – 40",
  description: MOOKATA_DESCRIPTION,
  image:
    "https://dimpgwotujtaacoajisn.supabase.co/storage/v1/object/public/partner-store-images/Thai%20Geng%20Mookata%20%20Bukit%20Jalil.webp",
  enrolledAt: "2026-02-14",
  perVisitFee: 3.0,
  plan: "Growth",
};

/* ------------------------------------------------------------ Signature SS2 */

const SIGNATURE_SS2: PartnerStore = {
  id: "tg-signature-ss2",
  name: "Thai Geng Signature Mookata Buffet SS2",
  type: "Thai Mookata · Buffet",
  city: "Petaling Jaya",
  address: "28, Jalan SS 2/66, SS 2, 47300 Petaling Jaya, Selangor",
  phone: "+60 10-658 8098",
  rating: 4.9,
  hours: "12:00 – 01:00",
  days: "Mon – Sun",
  priceRange: "RM 40 – 60",
  description: MOOKATA_DESCRIPTION,
  image:
    "https://dimpgwotujtaacoajisn.supabase.co/storage/v1/object/public/partner-store-images/Thai%20Geng%20Signature%20Mookata%20Buffet%20SS2.webp",
  enrolledAt: "2026-03-05",
  perVisitFee: 4.0,
  plan: "Starter",
};

/* ------------------------------------------------------------ Bukit Raja Klang */

const BUKIT_RAJA_KLANG: PartnerStore = {
  id: "tg-bukit-raja-klang",
  name: "Thai Geng Mookata Bukit Raja Klang",
  type: "Thai Mookata · Buffet",
  city: "Klang",
  address: "6G, Jalan Rodat 2/KU5, Bandar Bukit Raja, 41050 Klang, Selangor",
  phone: "+60 10-426 9749",
  rating: 4.9,
  hours: "12:00 – 03:00",
  days: "Mon – Sun",
  priceRange: "RM 20 – 40",
  description: MOOKATA_DESCRIPTION,
  image:
    "https://dimpgwotujtaacoajisn.supabase.co/storage/v1/object/public/partner-store-images/Thai%20Geng%20Bukit%20Raja.webp",
  enrolledAt: "2026-01-20",
  perVisitFee: 3.0,
  plan: "Premium",
};

/* ------------------------------------------------------------ configs */

export const STORE_CONFIGS: StoreConfig[] = [
  {
    store: BUKIT_JALIL,
    code: "BJ",
    monthlyTargets: {
      "2026-02": 15, // partial (enrolled Feb 14)
      "2026-03": 27,
      "2026-04": 33,
      "2026-05": 30,
    },
    normalMonthly: 30, // normal full-month rate for months after the ramp
    favorites: 96,
    avgAmount: 38,
    amountSpread: 26,
    minAmount: 22,
    maxAmount: 95,
    cityTable: [
      ["Bukit Jalil", 0.22],
      ["Kuala Lumpur", 0.2],
      ["Seri Kembangan", 0.12],
      ["Puchong", 0.11],
      ["Sungai Besi", 0.09],
      ["Cheras", 0.08],
      ["Sri Petaling", 0.07],
      ["Serdang", 0.05],
      ["Kajang", 0.04],
      ["Petaling Jaya", 0.02],
    ],
    contentScale: 0.55,
    contentArea: "Bukit Jalil",
  },
  {
    store: SIGNATURE_SS2,
    code: "SS2",
    monthlyTargets: {
      "2026-03": 14, // partial (enrolled Mar 5)
      "2026-04": 22,
      "2026-05": 20,
    },
    normalMonthly: 20,
    favorites: 62,
    avgAmount: 55,
    amountSpread: 30,
    minAmount: 32,
    maxAmount: 120,
    cityTable: [
      ["Petaling Jaya", 0.26],
      ["SS2", 0.14],
      ["Damansara", 0.12],
      ["Kelana Jaya", 0.1],
      ["Subang Jaya", 0.1],
      ["Kuala Lumpur", 0.09],
      ["Bandar Utama", 0.07],
      ["Kota Damansara", 0.06],
      ["Puchong", 0.04],
      ["Shah Alam", 0.02],
    ],
    contentScale: 0.4,
    contentArea: "SS2, PJ",
  },
  {
    store: BUKIT_RAJA_KLANG,
    code: "KLG",
    monthlyTargets: {
      "2026-01": 12, // partial (enrolled Jan 20)
      "2026-02": 38,
      "2026-03": 45,
      "2026-04": 54,
      "2026-05": 50,
    },
    normalMonthly: 50,
    favorites: 180,
    avgAmount: 38,
    amountSpread: 26,
    minAmount: 22,
    maxAmount: 95,
    cityTable: [
      ["Klang", 0.28],
      ["Bandar Bukit Raja", 0.16],
      ["Shah Alam", 0.14],
      ["Kapar", 0.1],
      ["Meru", 0.08],
      ["Port Klang", 0.07],
      ["Setia Alam", 0.07],
      ["Puchong", 0.04],
      ["Petaling Jaya", 0.03],
      ["Subang Jaya", 0.03],
    ],
    contentScale: 1.0,
    contentArea: "Klang",
  },
];
