"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { supabase, fetchPartnerAccounts } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

type SessionInfo = {
  userId: string;
  email: string | null;
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  const accountsQuery = useQuery({
    queryKey: ["partner-accounts", session?.userId],
    queryFn: () => fetchPartnerAccounts(session!.userId),
    enabled: !!session?.userId,
    staleTime: 5 * 60 * 1000,
  });

  // Defense in depth: a session with no partner_accounts row should never reach
  // this layout (login enforces it), but if someone bypasses login somehow, kick
  // them out here too.
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
        <Header
          partnerStoreIds={partnerStoreIds}
          userEmail={session.email}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
