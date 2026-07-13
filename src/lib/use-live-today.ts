"use client";

import { useEffect, useState } from "react";

import { MOCK_TODAY } from "@/lib/mock";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** The real current date as YYYY-MM-DD, resolved on the client.
 *
 * The business data (KPIs, billing, visits) stays pinned to MOCK_TODAY; this
 * only drives the rolling calendar so it always reaches the real "today" and
 * auto-advances each day (GitHub/LeetCode style).
 *
 * Starts at MOCK_TODAY so the first (server/build) render is deterministic —
 * no hydration mismatch — then extends forward to the real date on mount.
 */
export function useLiveToday(): string {
  const [today, setToday] = useState(MOCK_TODAY);

  useEffect(() => {
    const now = new Date();
    const real = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    // Only ever extend forward — never behind the pinned business anchor.
    if (real > MOCK_TODAY) setToday(real);
  }, []);

  return today;
}
