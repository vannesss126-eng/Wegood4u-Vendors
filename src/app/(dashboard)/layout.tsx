"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { supabase, fetchPartnerAccounts } from "@/lib/supabase";
import { IS_MOCK_AUTH, hasMockSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { AppFooter } from "@/components/dashboard/app-footer";

type SessionInfo = {
  userId: string;
  email: string | null;
};

// Pass 1 — mock auth gate. Renders the shell as long as the localStorage flag
// is present. The Supabase gate below activates when IS_MOCK_AUTH is false.
function MockAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [resolved, setResolved] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = hasMockSession();
    setResolved(ok);
    if (!ok) router.replace("/login");
  }, [router]);

  if (resolved === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!resolved) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header partnerStoreIds={[]} userEmail="partner@thaigeng.com" />
        <main className="flex-1 overflow-y-auto px-7 pb-4 pt-7">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

// Pass 2 — real Supabase gate (session + partner_accounts check).
function SupabaseAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null | undefined>(
    undefined
  );

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session?.user) {
        setSession(null);
        return;
      }
      setSession({
        userId: data.session.user.id,
        email: data.session.user.email ?? null,
      });
    };

    resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        if (!newSession?.user) {
          setSession(null);
          return;
        }
        setSession({
          userId: newSession.user.id,
          email: newSession.user.email ?? null,
        });
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  const accountsQuery = useQuery({
    queryKey: ["partner-accounts", session?.userId],
    queryFn: () => fetchPartnerAccounts(session!.userId),
    enabled: !!session?.userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (
      session &&
      accountsQuery.isSuccess &&
      accountsQuery.data.length === 0
    ) {
      supabase.auth.signOut().then(() => router.replace("/login"));
    }
  }, [session, accountsQuery.isSuccess, accountsQuery.data, router]);

  if (session === undefined || accountsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (session === null || !accountsQuery.data || accountsQuery.data.length === 0) {
    return null;
  }

  const partnerStoreIds = accountsQuery.data.map((a) => a.partner_store_id);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header partnerStoreIds={partnerStoreIds} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto px-7 pb-4 pt-7">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return IS_MOCK_AUTH ? (
    <MockAuthGate>{children}</MockAuthGate>
  ) : (
    <SupabaseAuthGate>{children}</SupabaseAuthGate>
  );
}
