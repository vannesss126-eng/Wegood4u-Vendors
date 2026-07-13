"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PartnerStore } from "@/types/domain";
import {
  DEFAULT_STORE_ID,
  MOCK_STORES,
  MOCK_STORE_IDS,
  getStoreDataset,
} from "@/lib/mock";
import type { StoreDataset } from "@/lib/mock";
import { useLiveToday } from "@/lib/use-live-today";

type ActiveStoreValue = {
  /** All stores the partner owns — drives the header switcher. */
  stores: PartnerStore[];
  /** Currently selected store id. */
  activeStoreId: string;
  /** The selected store profile. */
  store: PartnerStore;
  /** The selected store's full dataset — every page reads from here. */
  dataset: StoreDataset;
  /** The real current date (YYYY-MM-DD) the dataset is anchored to. */
  today: string;
  /** Switch the active store (persisted to localStorage). */
  setActiveStoreId: (id: string) => void;
};

const ActiveStoreContext = createContext<ActiveStoreValue | undefined>(undefined);

const LS_KEY = "wv-active-store";

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  // Deterministic first render (SSR + first client render both use the default),
  // then hydrate the last selection from localStorage on mount.
  const [activeStoreId, setActiveStoreIdState] = useState<string>(DEFAULT_STORE_ID);
  const today = useLiveToday();

  useEffect(() => {
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved && MOCK_STORE_IDS.includes(saved)) setActiveStoreIdState(saved);
  }, []);

  const setActiveStoreId = useCallback((id: string) => {
    if (!MOCK_STORE_IDS.includes(id)) return;
    setActiveStoreIdState(id);
    window.localStorage.setItem(LS_KEY, id);
  }, []);

  const value = useMemo<ActiveStoreValue>(() => {
    const dataset = getStoreDataset(activeStoreId, today);
    return {
      stores: MOCK_STORES,
      activeStoreId: dataset.store.id,
      store: dataset.store,
      dataset,
      today,
      setActiveStoreId,
    };
  }, [activeStoreId, today, setActiveStoreId]);

  return (
    <ActiveStoreContext.Provider value={value}>
      {children}
    </ActiveStoreContext.Provider>
  );
}

export function useActiveStore(): ActiveStoreValue {
  const ctx = useContext(ActiveStoreContext);
  if (ctx === undefined) {
    throw new Error("useActiveStore must be used within an ActiveStoreProvider");
  }
  return ctx;
}
