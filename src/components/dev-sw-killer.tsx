"use client";

import { useEffect } from "react";

/**
 * In development, unregister any previously-installed service worker on the
 * current origin. Without this, an old SW (registered during a prior
 * `next build` / `firebase deploy`) keeps intercepting requests and serving
 * stale JS — symptoms range from "click does nothing" to phantom UI from
 * months ago. The `disable: process.env.NODE_ENV === "development"` flag in
 * next.config.ts only prevents NEW SWs from being generated; it does NOT
 * unregister existing ones.
 *
 * No-ops in production builds. Returns null — pure side-effect component.
 */
export function DevSwKiller(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      })
      .catch(() => {
        // Silent fail — nothing we can do client-side if the SW API rejects.
      });
  }, []);

  return null;
}
