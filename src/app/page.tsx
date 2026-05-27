"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const route = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      router.replace(data.session ? "/dashboard" : "/login");
    };

    route();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
