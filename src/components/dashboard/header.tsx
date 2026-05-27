"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Store, User } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  partnerStoreIds: string[];
  userEmail: string | null;
};

export function Header({ partnerStoreIds, userEmail }: HeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      toast.success("Signed out.");
    } catch (err) {
      console.error(err);
      toast.error("Sign-out failed. Try again.");
      setSigningOut(false);
    }
  };

  const storeLabel =
    partnerStoreIds.length === 0
      ? "No store"
      : partnerStoreIds.length === 1
        ? "1 store"
        : `${partnerStoreIds.length} stores`;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">WV</span>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          aria-label="Store selector (multi-store coming in Phase 5)"
        >
          <Store className="h-3.5 w-3.5 text-primary" />
          {storeLabel}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <User className="h-3.5 w-3.5" />
          {userEmail ?? "Partner"}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
