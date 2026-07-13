// Builds each store's dataset on demand, anchored to a given "today", and caches
// per (storeId, today). The active-store context picks the store + passes the
// real current date; the header switcher changes the store.

import type { PartnerStore } from "@/types/domain";
import { buildStoreDataset, type StoreConfig, type StoreDataset } from "./generator";
import { STORE_CONFIGS } from "./stores";

/** Store profiles in switcher order. */
export const MOCK_STORES: PartnerStore[] = STORE_CONFIGS.map((c) => c.store);

/** All store ids the mock partner owns. */
export const MOCK_STORE_IDS: string[] = MOCK_STORES.map((s) => s.id);

/** Store shown on first load (before any switcher selection). */
export const DEFAULT_STORE_ID = MOCK_STORES[0].id;

const CONFIG_BY_ID: Record<string, StoreConfig> = Object.fromEntries(
  STORE_CONFIGS.map((c) => [c.store.id, c])
);

const cache = new Map<string, StoreDataset>();

/** Get a store's dataset for a given day (memoised per store + day). */
export function getStoreDataset(
  storeId: string | null | undefined,
  today: string
): StoreDataset {
  const id = storeId && CONFIG_BY_ID[storeId] ? storeId : DEFAULT_STORE_ID;
  const key = `${id}|${today}`;
  let ds = cache.get(key);
  if (!ds) {
    ds = buildStoreDataset(CONFIG_BY_ID[id], today);
    cache.set(key, ds);
  }
  return ds;
}
