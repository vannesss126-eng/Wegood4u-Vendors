"use client";

import { Bell, ChevronDown } from "lucide-react";

import { IS_MOCK_AUTH } from "@/lib/auth";
import { MOCK_STORE, MOCK_USER } from "@/lib/mock";

type HeaderProps = {
  partnerStoreIds: string[];
  userEmail: string | null;
};

// Topbar — sticky, frosted, matches 01-dashboard.html.
// Naming kept as `Header` so the layout import stays stable.
// In Pass 1 (mock auth), MOCK_STORE + MOCK_USER drive the pills.
// Pass 2 will fetch real store profile via partnerStoreIds.
export function Header({}: HeaderProps) {
  const store = MOCK_STORE; // TODO Pass 2: resolve from partnerStoreIds via Supabase
  const user = IS_MOCK_AUTH ? MOCK_USER : null;

  // Format enrollment date once — matches mockup "Enrolled 12 Feb 2026".
  const enrolled = new Date(store.enrolledAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-7 py-4 backdrop-blur-md">
      {/* LEFT: store pill + breadcrumb */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="inline-flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:border-border-hi"
        >
          <span className="h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
          <span>{store.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <span className="hidden text-xs font-medium text-text-dim sm:inline">
          {store.city} · Enrolled {enrolled}
        </span>
      </div>

      {/* RIGHT: notifications + user pill */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-[9px] border border-border bg-card transition-colors hover:border-border-hi hover:bg-bg-soft"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-foreground" />
          <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full bg-highlight shadow-[0_0_6px_rgba(240,89,42,0.4)]" />
        </button>

        <div className="flex items-center gap-2.5 rounded-full border border-border bg-card py-[5px] pl-[5px] pr-3.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-deep text-[11px] font-bold text-primary-foreground">
            {user?.initials ?? "—"}
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-[12.5px] font-semibold text-foreground">
              {user?.name ?? "Partner"}
            </span>
            <span className="text-[10.5px] font-medium text-text-dim">
              {user?.role ?? "Member"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
