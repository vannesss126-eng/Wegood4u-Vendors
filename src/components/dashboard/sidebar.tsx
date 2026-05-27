"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  Users,
  Clock,
  PlayCircle,
  Receipt,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/dashboard", icon: LayoutGrid },
  { label: "Visits", href: "/visits", icon: ListChecks },
  { label: "Demographics", href: "/demographics", icon: Users },
  { label: "Peak Hours", href: "/peak-hours", icon: Clock },
  { label: "Content", href: "/content", icon: PlayCircle },
  { label: "Billing", href: "/billing", icon: Receipt },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">WV</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Wegood4u Vendors
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <p className="px-3 text-[10px] uppercase tracking-wider text-text-dim">
          Wegood4u Vendors v0.1
        </p>
      </div>
    </aside>
  );
}
