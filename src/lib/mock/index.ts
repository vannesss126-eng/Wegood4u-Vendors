// Mock data barrel — multi-store edition.
//
// Three Thai Geng partner stores (Bukit Jalil, Signature SS2, Bukit Raja Klang),
// each with its own deterministically-generated dataset. The active store is
// chosen via the header switcher (see lib/active-store.tsx); pages read their
// data from `useActiveStore().dataset`.
//
// When Supabase queries land (Phase C onward), the per-store dataset is swapped
// for real queries/hooks — the page components and query shapes stay the same.

export { MOCK_USER } from "./user";
export {
  MOCK_STORES,
  MOCK_STORE_IDS,
  DEFAULT_STORE_ID,
  getStoreDataset,
} from "./datasets";
export { MOCK_TODAY, monthOptions } from "./constants";
export type { StoreDataset } from "./generator";
