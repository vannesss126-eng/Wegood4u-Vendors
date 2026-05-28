// Mock data barrel — single import surface for the dashboard during
// the "show-the-layout" phase. When Supabase queries land in Phase C onward,
// components will swap `from "@/lib/mock"` for `from "@/hooks/..."`.
//
// Mock partner: Thai Geng Mookata (Kepong, KL). Enrolled 2026-02-12.
// "Today" is 2026-05-27 across all files.

export { MOCK_STORE } from "./store";
export { MOCK_USER } from "./user";
export { MOCK_KPIS, MOCK_VISIT_TREND } from "./kpis";
export { MOCK_VISITS, MOCK_RECENT_VISITS } from "./visits";
export { MOCK_DEMOGRAPHICS } from "./demographics";
export { MOCK_CALENDAR } from "./calendar";
export { MOCK_CURRENT_STATEMENT, MOCK_BILLING_HISTORY } from "./billing";
export { MOCK_CONTENT } from "./content";
