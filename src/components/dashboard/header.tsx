"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, ChevronDown } from "lucide-react";

import { MOCK_USER } from "@/lib/mock";
import { useActiveStore } from "@/lib/active-store";
import { cn } from "@/lib/utils";

type HeaderProps = {
  partnerStoreIds: string[];
  userEmail: string | null;
};

// Topbar — sticky, frosted, matches 01-dashboard.html.
// The store pill is a working switcher: it lists every store the partner owns
// and swaps the active dataset across the whole app. Pass 2 will fetch the real
// store profiles via partnerStoreIds instead of the mock registry.
export function Header({}: HeaderProps) {
  const { stores, store, activeStoreId, setActiveStoreId } = useActiveStore();
  const user = MOCK_USER;

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const enrolled = new Date(store.enrolledAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/85 px-7 py-4 backdrop-blur-md">
      {/* LEFT: store switcher + breadcrumb */}
      <div className="flex items-center gap-3.5">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3.5 py-2 text-[12.5px] font-semibold text-foreground transition-colors hover:border-border-hi"
          >
            <span className="h-[7px] w-[7px] rounded-full bg-primary shadow-[0_0_8px_var(--primary-glow)]" />
            <span>{store.name}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          {open ? (
            <div
              role="listbox"
              className="absolute left-0 top-[calc(100%+8px)] z-20 w-[300px] overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-[0_12px_32px_-8px_rgba(14,20,16,0.18)]"
            >
              <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-text-dim">
                Your stores · {stores.length}
              </div>
              {stores.map((s) => {
                const isActive = s.id === activeStoreId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveStoreId(s.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      isActive
                        ? "bg-primary-soft"
                        : "hover:bg-bg-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-[3px] h-[7px] w-[7px] flex-shrink-0 self-start rounded-full",
                        isActive
                          ? "bg-primary shadow-[0_0_8px_var(--primary-glow)]"
                          : "bg-border-hi"
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[12.5px] font-semibold",
                          isActive ? "text-primary-deep" : "text-foreground"
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                        {s.city} · {s.plan}
                      </span>
                    </span>
                    {isActive ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-primary-deep" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

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
            {user.initials}
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-[12.5px] font-semibold text-foreground">
              {user.name}
            </span>
            <span className="text-[10.5px] font-medium text-text-dim">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
