// Thai Geng Mookata — MVP mock partner store.
// Sourced from public Bing Maps listing (Apr 2026 snapshot).
//
// Note: Thai Geng operates a sister branch at Bayu Tinggi (Klang). Multi-store
// support is Phase 5 per dashboard-build-plan.md — for MVP we mock only the
// Kepong (Batu) location. When multi-store ships, add a sibling export and
// extend the header store selector.

import type { PartnerStore } from "@/types/domain";

export const MOCK_STORE: PartnerStore = {
  id: "thaigeng-kepong-mookata",
  name: "Thai Geng Mookata",
  type: "Thai BBQ · Mookata",
  city: "Kuala Lumpur",
  address: "10 Jalan Metro Perdana Barat 3, 52100 Batu, Kuala Lumpur",
  phone: "+60 3-6243 4600",
  rating: 4.2,
  hours: "5:00 PM – 2:00 AM",
  days: "Mon – Sun",
  priceRange: "RM 30 – 55",
  description:
    "Thai-style mookata grill-and-broth dining in Kepong. Marinated meats, fresh seafood, clear-broth hotpot. Open late — popular with students and groups.",
  enrolledAt: "2026-02-12",
  perVisitFee: 3.0,
  plan: "Growth",
};
