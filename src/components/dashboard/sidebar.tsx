"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutGrid,
  LogOut,
  Settings,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import { IS_MOCK_AUTH, mockSignOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };

const ANALYTICS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Visits", href: "/visits", icon: CheckSquare },
  { label: "Demographics", href: "/demographics", icon: Users },
  { label: "Peak Hours", href: "/peak-hours", icon: CalendarDays },
  { label: "Content", href: "/content", icon: Video },
];

const ACCOUNT: NavItem[] = [
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleSignOut = async () => {
    if (IS_MOCK_AUTH) {
      mockSignOut();
    } else {
      await supabase.auth.signOut();
    }
    router.replace("/login");
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-bg-soft md:flex">
      {/* Brand head */}
      <div className="flex items-center gap-2.5 border-b border-border px-[22px] pb-6 pt-[22px]">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-primary-foreground shadow-[0_6px_16px_-6px_var(--primary-glow)]">
          WV
        </div>
        <div>
          <div className="text-[14.5px] font-bold leading-none tracking-tight text-foreground">
            Wegood4u
          </div>
          <div className="mt-[3px] text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-text-dim">
            Vendors
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <NavSection label="Analytics" items={ANALYTICS} isActive={isActive} />
        <NavSection label="Account" items={ACCOUNT} isActive={isActive} />
      </nav>

      {/* Sign-out footer */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="mb-1">
      <div className="px-2.5 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-text-dim">
        {label}
      </div>
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "mb-0.5 flex items-center gap-[11px] rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors",
              active
                ? "bg-primary-soft font-semibold text-primary-deep"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-[17px] w-[17px]",
                active ? "text-primary-deep" : "text-muted-foreground"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
