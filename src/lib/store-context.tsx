"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type PartnerStoreContextValue = {
  /** All store ids the signed-in partner is linked to (empty in mock auth mode). */
  storeIds: string[];
  /** The active store id — the first link. null when none (e.g. mock auth). */
  storeId: string | null;
};

const PartnerStoreContext = createContext<PartnerStoreContextValue | undefined>(
  undefined
);

export function PartnerStoreProvider({
  storeIds,
  children,
}: {
  storeIds: string[];
  children: ReactNode;
}) {
  const value = useMemo<PartnerStoreContextValue>(
    () => ({ storeIds, storeId: storeIds[0] ?? null }),
    [storeIds]
  );
  return (
    <PartnerStoreContext.Provider value={value}>
      {children}
    </PartnerStoreContext.Provider>
  );
}

export function usePartnerStore(): PartnerStoreContextValue {
  const ctx = useContext(PartnerStoreContext);
  if (ctx === undefined) {
    throw new Error("usePartnerStore must be used within a PartnerStoreProvider");
  }
  return ctx;
}
