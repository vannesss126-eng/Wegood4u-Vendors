"use client";

import { useEffect } from "react";

/**
 * In development, unregister any previously-installed service worker on the
 * current origin AND purge its workbox caches. Without this, an old SW
 * (registered during a prior local production run — `next start` / `firebase
 * serve` on localhost) keeps intercepting requests and serving a stale app
 * shell. With `skipWaiting` + `clientsClaim` (our next-pwa config) that stale
 * SW re-activates and reload-loops the page — the exact `GET /` ↔ `GET /login`
 * storm we hit. The `disable: NODE_ENV === "development"` flag in
 * next.config.ts only prevents NEW SWs from being generated; it does NOT
 * unregister existing ones or clear their caches.
 *
 * A one-time guarded reload (RELOAD_GUARD) evicts the controlling SW from the
 * current page without becoming its own loop.
 *
 * No-ops in production builds. Returns null — pure side-effect component.
 */
const RELOAD_GUARD = "wv-sw-killed";

export function DevSwKiller(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let removedController = false;

    Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.active === navigator.serviceWorker.controller) {
            removedController = true;
          }
          reg.unregister();
        }
      }),
      // Purge workbox precaches so a lingering controller can't keep serving a
      // stale shell before it's fully gone.
      typeof caches !== "undefined"
        ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        : Promise.resolve(),
    ])
      .then(() => {
        // Only reload if we actually evicted the SW controlling THIS page, and
        // only once per tab — the sessionStorage guard stops a reload loop.
        if (
          removedController &&
          !sessionStorage.getItem(RELOAD_GUARD)
        ) {
          sessionStorage.setItem(RELOAD_GUARD, "1");
          window.location.reload();
        }
      })
      .catch(() => {
        // Silent fail — nothing we can do client-side if the SW/Cache API rejects.
      });
  }, []);

  return null;
}
